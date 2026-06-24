import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const REQUIRED_COOKIES = ['c_user', 'xs', 'datr', 'sb'];
export const OPTIONAL_SIGNAL_COOKIES = ['presence', 'wd'];
export const CANDIDATE_BROWSER_WORKFLOWS = [
    'browser_backed_marketplace_reply',
    'browser_backed_inbox_review',
    'browser_backed_listing_ops',
];
export const LIVE_SELLER_THREADS_WORKFLOWS = [
    'live_marketplace_seller_thread_inventory',
    'live_marketplace_seller_reply_queue',
    'live_marketplace_seller_follow_up_queue',
];

const FACEBOOK_HOME_URL = 'https://www.facebook.com/';
const FACEBOOK_MARKETPLACE_URL = 'https://www.facebook.com/marketplace/';
const FACEBOOK_GRAPHQL_URL = 'https://www.facebook.com/api/graphql/';
const FACEBOOK_MESSAGING_SEND_URL = 'https://www.facebook.com/messaging/send/';
const SELLER_THREAD_INITIAL_DOC_ID = '26018704387747906';
const SELLER_THREAD_PAGINATION_DOC_ID = '25940357548956156';
const SELLER_THREAD_INITIAL_FRIENDLY_NAME = 'CometMarketplaceInboxSellerTabThreadViewContainerQuery';
const SELLER_THREAD_PAGINATION_FRIENDLY_NAME = 'CometMarketplaceInboxSellerTabThreadViewPaginationQuery';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
const DIRECT_HTTP_USER_AGENT = 'Mozilla/5.0';
const PP_CLI_BIN = 'facebook-marketplace-pp-cli';
const execFileAsync = promisify(execFile);

export const DEFAULT_THREADS = [
    {
        threadId: 'sample-thread-1',
        surface: 'marketplace_seller',
        threadUrl: 'https://www.facebook.com/messages/t/sample-thread-1',
        buyerName: 'Clara',
        listingTitle: '1 bed 1 bath Room only',
        city: 'Madrid',
        lastMessage: 'Sigue estando disponible?',
        lastMessageAt: '2026-05-20T12:00:00Z',
        buyerIntent: 'availability',
        status: 'needs_follow_up',
        unreadCount: 1,
    },
    {
        threadId: 'sample-thread-2',
        surface: 'messenger_direct',
        threadUrl: 'https://www.facebook.com/messages/e2ee/t/sample-thread-2',
        buyerName: 'Jp Hrez',
        listingTitle: 'Habitacion Madrid',
        city: 'Madrid',
        lastMessage: 'Como te va el puente?',
        lastMessageAt: '2026-05-19T16:10:00Z',
        buyerIntent: 'reactivation',
        status: 'needs_follow_up',
        unreadCount: 0,
    },
];

export const DEFAULT_LISTINGS = [
    {
        listingId: 'sample-listing-1',
        title: 'iPhone 15 Pro 128GB',
        price: 699,
        daysLive: 9,
        favorites: 18,
        messages: 6,
        status: 'active',
    },
    {
        listingId: 'sample-listing-2',
        title: 'MacBook Air M2',
        price: 850,
        daysLive: 21,
        favorites: 4,
        messages: 0,
        status: 'active',
    },
];

export function parseCookiesJson(raw) {
    if (!raw || !raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
        throw new Error('cookiesJson must be a JSON array of cookie objects.');
    }
    return parsed;
}

function clampNumber(value, min, max, fallback) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(numericValue)));
}

function getRequiredCookieState(cookies) {
    const names = new Set(cookies.map((cookie) => cookie.name).filter(Boolean));
    const presentCookies = REQUIRED_COOKIES.filter((name) => names.has(name));
    const missingCookies = REQUIRED_COOKIES.filter((name) => !names.has(name));
    return {
        presentCookies,
        missingCookies,
        hasRequiredCookies: missingCookies.length === 0,
        optionalSignals: OPTIONAL_SIGNAL_COOKIES.filter((name) => names.has(name)),
    };
}

function cookieHeaderFromCookies(cookies) {
    const usableCookies = cookies
        .filter((cookie) => cookie && cookie.name && cookie.value !== undefined && cookie.value !== null)
        .map((cookie) => `${cookie.name}=${cookie.value}`);

    if (usableCookies.length === 0) {
        throw new Error('cookiesJson did not contain any usable name/value cookies.');
    }

    return usableCookies.join('; ');
}

function getFacebookGraphqlHeaders(cookieHeader, input = {}) {
    return {
        'accept': '*/*',
        'accept-language': input.acceptLanguage || 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookieHeader,
        'origin': 'https://www.facebook.com',
        'referer': 'https://www.facebook.com/marketplace/inbox/',
        'user-agent': input.userAgent || input.directHttpUserAgent || DIRECT_HTTP_USER_AGENT,
    };
}

function getFacebookMessagingHeaders(cookieHeader, input = {}, threadId = null) {
    return {
        'accept': '*/*',
        'accept-language': input.acceptLanguage || 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookieHeader,
        'origin': 'https://www.facebook.com',
        'referer': threadId
            ? `https://www.facebook.com/messages/t/${threadId}`
            : 'https://www.facebook.com/messages/',
        'user-agent': input.userAgent || input.directHttpUserAgent || DIRECT_HTTP_USER_AGENT,
    };
}

function getFacebookHtmlHeaders(cookieHeader, input = {}) {
    return {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': input.acceptLanguage || 'en-US,en;q=0.9',
        'cookie': cookieHeader,
        'user-agent': input.userAgent || input.directHttpUserAgent || DIRECT_HTTP_USER_AGENT,
    };
}

function getCookieValue(cookies, name) {
    return cookies.find((cookie) => cookie?.name === name)?.value || null;
}

function extractFbDtsg(html) {
    const patterns = [
        /\["DTSGInitialData",\[\],\{"token":"([^"]+)"/,
        /"DTSGInitialData",\[\],\{"token":"([^"]+)"/,
        /"token":"([^"]+)","async_get_token"/,
        /name="fb_dtsg"\s+value="([^"]+)"/,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1].replaceAll('\\/', '/');
    }

    return null;
}

function extractLsd(html) {
    const patterns = [
        /\["LSD",\[\],\{"token":"([^"]+)"/,
        /"LSD",\[\],\{"token":"([^"]+)"/,
        /name="lsd"\s+value="([^"]+)"/,
        /"token":"([^"]+)","field":"lsd"/,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1].replaceAll('\\/', '/');
    }

    return null;
}

function extractRevision(html) {
    const patterns = [
        /"client_revision":(\d+)/,
        /"server_revision":(\d+)/,
        /"revision":(\d+)/,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1];
    }

    return null;
}

function extractHtmlCurrentUserId(html) {
    const match = html.match(/"CurrentUserInitialData",\[\],\{"ACCOUNT_ID":"([^"]*)","USER_ID":"([^"]*)"/);
    return match?.[2] || null;
}

function buildJazoest(token) {
    if (!token) return null;
    let value = '2';
    for (const char of token) {
        value += char.charCodeAt(0);
    }
    return value;
}

function buildReqToken(index = 1) {
    return Math.max(1, Number(index) || 1).toString(36);
}

function generateThreadingID(clientId = 'client') {
    return `<${Date.now()}:${Math.floor(Math.random() * 4294967295)}-${clientId}@mail.projektitan.com>`;
}

function binaryToDecimal(binary) {
    let remaining = binary;
    let decimal = '';
    while (remaining !== '0') {
        let carry = 0;
        let next = '';
        for (const digit of remaining) {
            carry = (carry * 2) + Number(digit);
            if (carry >= 10) {
                next += '1';
                carry -= 10;
            } else {
                next += '0';
            }
        }
        decimal = String(carry) + decimal;
        remaining = next.slice(next.indexOf('1'));
        if (!remaining) break;
    }
    return decimal || '0';
}

function generateOfflineThreadingId() {
    const timestampBits = Date.now().toString(2);
    const randomBits = (`${Math.floor(Math.random() * 4294967295).toString(2)}`).padStart(22, '0').slice(-22);
    return binaryToDecimal(timestampBits + randomBits);
}

function generateTimestampRelative() {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getSignatureId() {
    return Math.floor(Math.random() * 2147483648).toString(16);
}

function parseFacebookJson(text) {
    const trimmed = text.trim();
    const clean = trimmed.startsWith('for (;;);') ? trimmed.slice('for (;;);'.length) : trimmed;
    return JSON.parse(clean);
}

function parseJsonFromStdout(stdout) {
    const text = String(stdout || '').trim();
    if (!text) throw new Error('Command returned empty stdout.');
    const jsonStart = text.indexOf('{');
    const arrayStart = text.indexOf('[');
    const startIndexes = [jsonStart, arrayStart].filter((index) => index >= 0);
    if (startIndexes.length === 0) {
        throw new Error(`Command stdout did not contain JSON: ${text.slice(0, 240)}`);
    }
    return JSON.parse(text.slice(Math.min(...startIndexes)));
}

async function runPpCli(args, input) {
    const bin = input.ppCliPath || PP_CLI_BIN;
    const timeout = clampNumber(input.ppCliTimeoutMs, 5000, 120000, 45000);
    try {
        const result = await execFileAsync(bin, args, {
            timeout,
            maxBuffer: 20 * 1024 * 1024,
            env: {
                ...process.env,
                ...(input.ppCliConfig ? { FACEBOOK_MARKET_CONFIG: input.ppCliConfig } : {}),
            },
        });
        return parseJsonFromStdout(result.stdout);
    } catch (error) {
        const stderr = error.stderr ? String(error.stderr).slice(0, 500) : '';
        const stdout = error.stdout ? String(error.stdout).slice(0, 500) : '';
        throw new Error(`facebook-marketplace-pp-cli failed: ${error.message}${stderr ? ` stderr=${stderr}` : ''}${stdout ? ` stdout=${stdout}` : ''}`);
    }
}

function normalizeCookieForCdp(cookie) {
    const normalized = {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || '.facebook.com',
        path: cookie.path || '/',
        secure: cookie.secure !== false,
        httpOnly: Boolean(cookie.httpOnly),
    };
    if (cookie.expirationDate) normalized.expires = Number(cookie.expirationDate);
    if (cookie.sameSite) {
        const sameSite = String(cookie.sameSite).toLowerCase();
        if (sameSite.includes('lax')) normalized.sameSite = 'Lax';
        if (sameSite.includes('strict')) normalized.sameSite = 'Strict';
        if (sameSite.includes('none') || sameSite.includes('no_restriction')) normalized.sameSite = 'None';
    }
    return normalized;
}

async function connectCdp(wsUrl) {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.id && pending.has(message.id)) {
            const { resolve, reject } = pending.get(message.id);
            pending.delete(message.id);
            if (message.error) {
                reject(new Error(message.error.message || JSON.stringify(message.error)));
            } else {
                resolve(message.result);
            }
        }
    };

    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
    });

    return {
        send(method, params = {}) {
            const messageId = ++id;
            ws.send(JSON.stringify({ id: messageId, method, params }));
            return new Promise((resolve, reject) => pending.set(messageId, { resolve, reject }));
        },
        close() {
            ws.close();
        },
    };
}

async function openCdpTab(cdpUrl) {
    if (cdpUrl.startsWith('ws://') || cdpUrl.startsWith('wss://')) {
        return { webSocketDebuggerUrl: cdpUrl };
    }

    const baseUrl = cdpUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/json/new?https://www.facebook.com/`, { method: 'PUT' });
    if (!response.ok) {
        throw new Error(`CDP tab creation failed with HTTP ${response.status}.`);
    }
    return response.json();
}

function buildBrowserGraphqlExpression({ maxPages, pageSize }) {
    return `(${async function runSellerThreadFetch(config) {
        function parseFacebookJson(text) {
            const trimmed = text.trim();
            const clean = trimmed.startsWith('for (;;);') ? trimmed.slice('for (;;);'.length) : trimmed;
            return JSON.parse(clean);
        }
        function extractFbDtsg() {
            const html = document.documentElement.outerHTML;
            const patterns = [
                /\["DTSGInitialData",\[\],\{"token":"([^"]+)"/,
                /"DTSGInitialData",\[\],\{"token":"([^"]+)"/,
                /"token":"([^"]+)","async_get_token"/,
                /name="fb_dtsg"\s+value="([^"]+)"/,
            ];
            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match?.[1]) return match[1].replaceAll('\\/', '/');
            }
            return null;
        }
        async function gql({ docId, friendlyName, variables, fbDtsg }) {
            const body = new URLSearchParams({
                __a: '1',
                fb_api_caller_class: 'RelayModern',
                fb_api_req_friendly_name: friendlyName,
                doc_id: docId,
                variables: JSON.stringify(variables),
                fb_dtsg: fbDtsg,
            });
            const response = await fetch('/api/graphql/', {
                method: 'POST',
                credentials: 'include',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body,
            });
            const text = await response.text();
            return { status: response.status, json: parseFacebookJson(text), textStart: text.slice(0, 240) };
        }

        const fbDtsg = extractFbDtsg();
        if (!fbDtsg) {
            throw new Error('fb_dtsg token not found in browser page.');
        }

        const responses = [];
        let cursor = null;
        let hasNextPage = true;
        let pageNumber = 1;

        while (pageNumber <= config.maxPages && hasNextPage) {
            const firstPage = pageNumber === 1;
            const response = await gql({
                docId: firstPage ? config.initialDocId : config.paginationDocId,
                friendlyName: firstPage ? config.initialFriendlyName : config.paginationFriendlyName,
                variables: firstPage
                    ? { filterLabels: null, lookBackInDays: null }
                    : { count: config.pageSize, cursor, filterLabels: null, lookBackInDays: null },
                fbDtsg,
            });
            responses.push({ pageNumber, ...response });
            const connection = response.json?.data?.viewer?.marketplaceInboxSellerMessageThreads;
            const edges = connection?.edges || [];
            cursor = connection?.page_info?.end_cursor || edges.at(-1)?.cursor || null;
            hasNextPage = Boolean(connection?.page_info?.has_next_page ?? cursor);
            if (!cursor || edges.length === 0) break;
            pageNumber += 1;
        }

        return {
            title: document.title,
            url: location.href,
            bodyTextStart: document.body.innerText.slice(0, 300),
            hasMarketplace: document.body.innerText.includes('Marketplace'),
            hasZimo: document.body.innerText.includes('Zimo'),
            fbDtsgPresent: true,
            responses,
        };
    }.toString()})(${JSON.stringify({
        maxPages,
        pageSize,
        initialDocId: SELLER_THREAD_INITIAL_DOC_ID,
        paginationDocId: SELLER_THREAD_PAGINATION_DOC_ID,
        initialFriendlyName: SELLER_THREAD_INITIAL_FRIENDLY_NAME,
        paginationFriendlyName: SELLER_THREAD_PAGINATION_FRIENDLY_NAME,
    })})`;
}

async function fetchLiveSellerThreadsViaCdp(input, cookies, maxPages, pageSize) {
    const cdpUrl = input.browserCdpUrl || input.cdpUrl || input.cdpEndpoint;
    if (!cdpUrl) return null;

    const tab = await openCdpTab(cdpUrl);
    const client = await connectCdp(tab.webSocketDebuggerUrl);
    try {
        await client.send('Network.enable');
        await client.send('Page.enable');
        await client.send('Network.setCookies', { cookies: cookies.map(normalizeCookieForCdp) });
        await client.send('Page.navigate', { url: FACEBOOK_HOME_URL });
        await new Promise((resolve) => setTimeout(resolve, clampNumber(input.browserWaitMs, 1000, 15000, 5000)));

        const result = await client.send('Runtime.evaluate', {
            expression: buildBrowserGraphqlExpression({ maxPages, pageSize }),
            awaitPromise: true,
            returnByValue: true,
        });
        const value = result.result?.value;
        if (!value?.responses?.length) {
            throw new Error('CDP browser fetch did not return seller-thread GraphQL responses.');
        }

        const items = [];
        for (const response of value.responses) {
            if (response.status !== 200) {
                throw new Error(`CDP browser GraphQL page ${response.pageNumber} failed with HTTP ${response.status}: ${response.textStart || ''}`);
            }
            const connection = getSellerThreadConnection(response.json);
            items.push(...connection.edges
                .map((edge) => mapLiveSellerThread(edge, response.pageNumber))
                .filter((item) => item.threadId || item.buyerName || item.listingTitle || item.lastMessage)
                .map((item) => ({ ...item, fbDtsgSource: 'browser_cdp' })));
        }

        return {
            items,
            browserProof: {
                title: value.title,
                url: value.url,
                hasMarketplace: value.hasMarketplace,
                hasZimo: value.hasZimo,
                fbDtsgPresent: value.fbDtsgPresent,
            },
        };
    } finally {
        client.close();
    }
}

async function fetchFacebookContext(cookies, input) {
    const cookieHeader = cookieHeaderFromCookies(cookies);
    const providedFbDtsg = (input.fbDtsg || input.fb_dtsg || '').trim();
    if (providedFbDtsg) {
        const userId = getCookieValue(cookies, 'c_user');
        return {
            cookieHeader,
            fbDtsg: providedFbDtsg,
            fbDtsgSource: 'input',
            lsd: (input.lsd || '').trim() || null,
            revision: (input.rev || input.__rev || '').trim() || null,
            jazoest: (input.jazoest || '').trim() || buildJazoest(providedFbDtsg),
            userId,
        };
    }

    const response = await fetch(FACEBOOK_MARKETPLACE_URL, {
        method: 'GET',
        headers: getFacebookHtmlHeaders(cookieHeader, input),
    });
    const html = await response.text();
    const fbDtsg = extractFbDtsg(html);
    const lsd = extractLsd(html);
    const revision = extractRevision(html);
    const userId = getCookieValue(cookies, 'c_user');
    const jazoest = buildJazoest(fbDtsg);
    const htmlUserId = extractHtmlCurrentUserId(html);

    if (!response.ok) {
        throw new Error(`Facebook marketplace request failed with HTTP ${response.status}.`);
    }
    if (!fbDtsg) {
        const hasLoginMarker = html.includes('name="email"')
            || html.includes('login_form')
            || html.includes('Log in to Facebook')
            || html.includes('device-based/login/caa/')
            || html.includes('CAAFBLoginHomepageRoot')
            || html.includes('"USER_ID":"0"')
            || htmlUserId === '0';
        throw new Error(hasLoginMarker
            ? 'Facebook cookies reached a remembered-account or login shell instead of an authenticated session.'
            : 'Facebook marketplace loaded but fb_dtsg token was not found.');
    }

    return {
        cookieHeader,
        fbDtsg,
        fbDtsgSource: 'facebook_marketplace',
        lsd,
        revision,
        jazoest,
        userId,
    };
}

async function facebookGraphql({ context, docId, friendlyName, variables, input, requestOrdinal = 1 }) {
    const body = new URLSearchParams({
        __a: '1',
        __req: buildReqToken(requestOrdinal),
        __rev: context.revision || '',
        __user: context.userId || '',
        av: context.userId || '',
        __ccg: 'GOOD',
        dpr: String(input.devicePixelRatio || 1),
        fb_api_caller_class: 'RelayModern',
        fb_api_req_friendly_name: friendlyName,
        doc_id: docId,
        variables: JSON.stringify(variables),
        fb_dtsg: context.fbDtsg,
        jazoest: context.jazoest || '',
        lsd: context.lsd || '',
        server_timestamps: 'true',
    });

    const response = await fetch(FACEBOOK_GRAPHQL_URL, {
        method: 'POST',
        headers: {
            ...getFacebookGraphqlHeaders(context.cookieHeader, input),
            ...(context.lsd ? { 'x-fb-lsd': context.lsd } : {}),
            'x-fb-friendly-name': friendlyName,
        },
        body,
    });
    const text = await response.text();

    if (!response.ok) {
        throw new Error(`Facebook GraphQL request ${friendlyName} failed with HTTP ${response.status}: ${text.slice(0, 240)}`);
    }

    const json = parseFacebookJson(text);
    if (json.errors?.length) {
        const firstError = json.errors[0];
        throw new Error(`Facebook GraphQL request ${friendlyName} returned error: ${firstError.message || JSON.stringify(firstError).slice(0, 240)}`);
    }

    return json;
}

async function sendFacebookMessage({ context, threadId, buyerId, message, input, requestOrdinal = 1 }) {
    const messageAndOfflineId = generateOfflineThreadingId();
    const userId = context.userId || getCookieValue(parseCookiesJson(input.cookiesJson || '[]'), 'c_user');
    if (!userId) {
        throw new Error('Facebook send requires c_user in cookies.');
    }

    const form = {
        __a: '1',
        __req: buildReqToken(requestOrdinal),
        __rev: context.revision || '',
        __user: userId,
        fb_dtsg: context.fbDtsg,
        jazoest: context.jazoest || '',
        client: 'mercury',
        action_type: 'ma-type:user-generated-message',
        author: `fbid:${userId}`,
        timestamp: String(Date.now()),
        timestamp_absolute: 'Today',
        timestamp_relative: generateTimestampRelative(),
        timestamp_time_passed: '0',
        is_unread: 'false',
        is_cleared: 'false',
        is_forward: 'false',
        is_filtered_content: 'false',
        is_filtered_content_bh: 'false',
        is_filtered_content_account: 'false',
        is_filtered_content_quasar: 'false',
        is_filtered_content_invalid_app: 'false',
        is_spoof_warning: 'false',
        source: 'source:chat:web',
        'source_tags[0]': 'source:chat',
        body: String(message),
        html_body: 'false',
        ui_push_phase: 'V3',
        status: '0',
        offline_threading_id: messageAndOfflineId,
        message_id: messageAndOfflineId,
        threading_id: generateThreadingID(userId),
        manual_retry_cnt: '0',
        has_attachment: 'false',
        signatureID: getSignatureId(),
        'ephemeral_ttl_mode:': '0',
    };

    if (buyerId) {
        form['specific_to_list[0]'] = `fbid:${buyerId}`;
        form['specific_to_list[1]'] = `fbid:${userId}`;
        form.other_user_fbid = String(buyerId);
    } else {
        form.thread_fbid = String(threadId);
    }

    const response = await fetch(FACEBOOK_MESSAGING_SEND_URL, {
        method: 'POST',
        headers: getFacebookMessagingHeaders(context.cookieHeader, input, threadId),
        body: new URLSearchParams(form),
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Facebook messaging/send failed with HTTP ${response.status}: ${text.slice(0, 240)}`);
    }
    const json = parseFacebookJson(text);
    if (json.error || json.errors?.length) {
        const error = json.errors?.[0] || json;
        throw new Error(`Facebook messaging/send returned error: ${error.message || JSON.stringify(error).slice(0, 240)}`);
    }
    return json;
}

function getSellerThreadConnection(json) {
    const connection = json?.data?.viewer?.marketplaceInboxSellerMessageThreads
        || json?.data?.data?.viewer?.marketplaceInboxSellerMessageThreads;
    if (!connection || !Array.isArray(connection.edges)) {
        throw new Error('Facebook GraphQL response did not include marketplaceInboxSellerMessageThreads.edges.');
    }
    return connection;
}

function normalizeTimestamp(value) {
    if (!value) return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
        return new Date(numeric).toISOString();
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function getFirstMessageSnippet(node) {
    const messageNode = node?.messages?.edges?.[0]?.node;
    return messageNode?.snippet || messageNode?.body?.text || null;
}

function mapLiveSellerThread(edge, pageNumber) {
    const node = edge?.node || {};
    const buyer = node.other_user
        || node.thread_partner
        || node.other_participants?.edges?.[0]?.node?.messaging_actor
        || node.participants?.edges?.[0]?.node
        || {};
    const listing = node.marketplace_listing
        || node.marketplace_thread_data?.messageable_item
        || node.for_sale_item
        || node.associated_listing
        || {};
    const lastMessageAt = normalizeTimestamp(node.updated_time_precise || node.updated_time || node.last_message_timestamp);
    const unreadCount = Number(node.unread_count || node.unreadCount || 0);
    const lastMessage = getFirstMessageSnippet(node);
    const threadId = node.thread_id || node.thread_key?.thread_fbid || node.id || edge?.cursor || null;
    const listingId = listing.id || listing.listing_id || null;
    const thread = {
        threadId,
        surface: 'marketplace_seller',
        threadUrl: threadId ? `https://www.facebook.com/messages/t/${threadId}` : null,
        buyerName: buyer.name || buyer.short_name || null,
        buyerId: buyer.id || null,
        listingId,
        listingTitle: listing.marketplace_listing_title || listing.title || listing.name || null,
        lastMessage,
        lastMessageAt,
        unreadCount,
        status: unreadCount > 0 ? 'unread' : 'open',
        liveFetchPage: pageNumber,
        cursor: edge?.cursor || null,
    };
    const action = classifyReplyAction(thread);

    return {
        mode: 'fetch_live_seller_threads',
        resultType: 'live_seller_thread',
        dataOrigin: 'live_facebook_graphql',
        authProofLevel: 'live_graphql_seller_threads',
        workflowReadiness: 'live_seller_threads_verified',
        ...thread,
        buyerIntent: inferBuyerIntent(thread),
        daysSinceLastMessage: getThreadAgeDays(thread),
        recommendedAction: action.recommendedAction,
        priority: action.priority,
        reason: action.reason,
        sampleDataUsed: false,
    };
}

function renderTemplate(template, values) {
    return template.replaceAll(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = values[key];
        return value === undefined || value === null ? '' : String(value);
    }).replace(/\s+/g, ' ').trim();
}

function normalizeSurface(surface) {
    const value = (surface || '').trim().toLowerCase();
    if (['marketplace_seller', 'marketplace_buyer', 'messenger_direct', 'messenger_group'].includes(value)) {
        return value;
    }
    return 'messenger_direct';
}

function getThreadAgeHours(thread) {
    if (thread.hoursSinceLastMessage !== undefined && thread.hoursSinceLastMessage !== null) {
        return Number(thread.hoursSinceLastMessage) || 0;
    }
    if (thread.daysSinceLastMessage !== undefined && thread.daysSinceLastMessage !== null) {
        return (Number(thread.daysSinceLastMessage) || 0) * 24;
    }
    if (thread.lastMessageAt) {
        const parsed = Date.parse(thread.lastMessageAt);
        if (!Number.isNaN(parsed)) {
            return Math.max(0, (Date.now() - parsed) / (1000 * 60 * 60));
        }
    }
    return 0;
}

function getThreadAgeDays(thread) {
    return Number((getThreadAgeHours(thread) / 24).toFixed(1));
}

function inferBuyerIntent(thread) {
    const explicitIntent = (thread.buyerIntent || '').trim().toLowerCase();
    if (explicitIntent) return explicitIntent;

    const lastMessage = (thread.lastMessage || '').toLowerCase();
    if (lastMessage.includes('disponible')) return 'availability';
    if (lastMessage.includes('rebaja') || lastMessage.includes('dejas') || lastMessage.includes('precio')) return 'negotiation';
    if (lastMessage.includes('hoy') || lastMessage.includes('manana') || lastMessage.includes('mañana') || lastMessage.includes('recoger')) return 'pickup';
    if (lastMessage.includes('puente') || lastMessage.includes('sigues') || lastMessage.includes('hola')) return 'reactivation';
    return 'general_interest';
}

function getReplyTone(style, thread) {
    const city = thread.city || 'tu zona';
    const surface = normalizeSurface(thread.surface);
    const templates = {
        concise_friendly: 'Hola {{buyerName}}, sigue disponible {{listingTitle}}. Si te encaja, puedo cerrar entrega hoy en {{city}}.',
        firm_fast_close: 'Hola {{buyerName}}, {{listingTitle}} sigue disponible. Si te interesa de verdad, te confirmo recogida hoy en {{city}}.',
        premium_trust_building: 'Hola {{buyerName}}, gracias por escribir. {{listingTitle}} sigue disponible y esta listo para entrega en {{city}}. Si quieres, te paso detalles y cerramos horario.',
    };
    const marketplaceReply = renderTemplate(templates[style] || templates.concise_friendly, {
        buyerName: thread.buyerName || 'hola',
        listingTitle: thread.listingTitle || 'el producto',
        city,
    });
    if (surface === 'messenger_direct' || surface === 'messenger_group') {
        return renderTemplate('Hola {{buyerName}}, te escribo para retomar la conversacion. Si todavia te interesa {{listingTitle}}, te paso disponibilidad actualizada.', {
            buyerName: thread.buyerName || 'hola',
            listingTitle: thread.listingTitle || 'el producto',
        });
    }
    return marketplaceReply;
}

function getFollowUpDraft(style, thread) {
    const days = getThreadAgeDays(thread);
    const surface = normalizeSurface(thread.surface);
    const listingTitle = thread.listingTitle || 'el producto';
    const buyerName = thread.buyerName || 'hola';

    if (surface === 'marketplace_seller' || surface === 'marketplace_buyer') {
        return renderTemplate('Hola {{buyerName}}, retomo por si todavia te interesa {{listingTitle}}. Lo sigo teniendo disponible y te confirmo horario si quieres cerrarlo.', {
            buyerName,
            listingTitle,
        });
    }

    const directTemplate = style === 'firm_fast_close'
        ? 'Hola {{buyerName}}, cierro este hilo si ya no te interesa {{listingTitle}}. Si sigues interesado, te digo disponibilidad hoy mismo.'
        : 'Hola {{buyerName}}, reabro el hilo por si sigues interesado en {{listingTitle}}. Han pasado {{days}} dias desde el ultimo mensaje y te actualizo disponibilidad si te viene bien.';

    return renderTemplate(directTemplate, { buyerName, listingTitle, days });
}

function getRentalAvailabilityDetails(input) {
    return {
        propertyLabel: input.propertyLabel || input.roomLabel || 'la habitacion',
        area: input.area || input.locationArea || input.city || 'Madrid',
        stayWindow: input.stayWindow || input.rentalWindow || 'dias o semanas',
        stayRestriction: input.stayRestriction || input.restrictionText || 'No meses ni estancias largas',
        availabilityText: input.availabilityText || input.availableNowText || 'ahora mismo tenemos disponibilidad',
        contactPhone: input.contactPhone || input.whatsappNumber || '',
        contactChannel: input.contactChannel || (input.contactPhone ? 'WhatsApp' : ''),
        balcony: input.hasBalcony === false ? '' : (input.balconyText || 'balcon privado'),
        airConditioning: input.hasAirConditioning === false ? '' : (input.airConditioningText || 'aire acondicionado'),
    };
}

function getRentalFollowUpDraft(input, thread) {
    const details = getRentalAvailabilityDetails(input);
    const buyerName = thread.buyerName || 'hola';
    const listingTitle = thread.listingTitle || details.propertyLabel;
    const days = getThreadAgeDays(thread);
    const intent = inferBuyerIntent(thread);
    const featureBits = [details.airConditioning, details.balcony].filter(Boolean).join(' y ');
    const featureLine = featureBits ? ` Es una opcion con ${featureBits}.` : '';
    const contactLine = details.contactPhone
        ? ` Si te encaja, escribeme por ${details.contactChannel || 'WhatsApp'} al ${details.contactPhone} y te confirmo.` : ' Si te encaja, te confirmo por aqui.';

    if (intent.includes('availability')) {
        return `Hola ${buyerName}, te retomo por si todavia buscas habitacion. ${details.availabilityText} en ${details.area} para ${details.stayWindow}.${featureLine} ${details.stayRestriction}.${contactLine}`.replace(/\s+/g, ' ').trim();
    }

    if (intent.includes('pickup') || intent.includes('reactivation')) {
        return `Hola ${buyerName}, reabro el hilo por si sigues necesitando ${listingTitle}. Ahora mismo tenemos disponibilidad en ${details.area} para ${details.stayWindow}.${featureLine} ${details.stayRestriction}.${contactLine}`.replace(/\s+/g, ' ').trim();
    }

    return `Hola ${buyerName}, han pasado ${days} dias desde el ultimo mensaje y te escribo por si todavia necesitas ${listingTitle}. ${details.availabilityText} en ${details.area} para ${details.stayWindow}.${featureLine} ${details.stayRestriction}.${contactLine}`.replace(/\s+/g, ' ').trim();
}

function shouldSkipFollowUpThread(thread, input = {}) {
    if (input.skipClosedThreads === false) return false;
    const message = String(thread.lastMessage || '').toLowerCase();
    const stopMarkers = [
        'no me interesa',
        'ya no me interesa',
        'no gracias',
        'gracias no',
        'ya consegui',
        'ya tengo',
        'busco otra',
        'siga soñando',
    ];
    return stopMarkers.some((marker) => message.includes(marker));
}

function classifyReplyAction(thread) {
    const intent = inferBuyerIntent(thread);
    const hours = getThreadAgeHours(thread);
    const surface = normalizeSurface(thread.surface);

    if (intent.includes('availability')) {
        return { recommendedAction: 'reply_now', priority: hours <= 2 ? 'high' : 'medium', reason: 'Fresh buyer message with availability intent' };
    }
    if (intent.includes('negotiation')) {
        return { recommendedAction: 'counter_or_hold', priority: 'medium', reason: 'Negotiation message should be answered with a bounded seller stance' };
    }
    if ((surface === 'messenger_direct' || surface === 'messenger_group') && hours >= 24 * 20) {
        return { recommendedAction: 'reactivate_thread', priority: 'medium', reason: 'Older inbox thread is a candidate for a polite reactivation pass.' };
    }
    if (hours > 24) {
        return { recommendedAction: 'follow_up_or_close', priority: 'low', reason: 'Stale conversation should be followed up or closed' };
    }
    return { recommendedAction: 'reply_now', priority: 'medium', reason: 'Buyer thread needs active seller handling' };
}

function withSampleData(input) {
    const useSampleData = input.useSampleData !== false;
    const mode = input.mode || 'build_reply_queue';
    const enriched = { ...input };
    let sampleDataUsed = false;

    if (useSampleData && ['conversation_inventory', 'build_reply_queue', 'build_follow_up_queue', 'send_follow_up_batch'].includes(mode) && (!Array.isArray(input.threads) || input.threads.length === 0)) {
        enriched.threads = DEFAULT_THREADS;
        sampleDataUsed = true;
    }

    if (useSampleData && mode === 'listing_ops_plan' && (!Array.isArray(input.listings) || input.listings.length === 0)) {
        enriched.listings = DEFAULT_LISTINGS;
        sampleDataUsed = true;
    }

    return { enriched, sampleDataUsed };
}

function buildConversationInventory(input, sampleDataUsed) {
    const threads = Array.isArray(input.threads) ? input.threads : [];

    return threads.map((thread, index) => {
        const action = classifyReplyAction(thread);
        return {
            mode: 'conversation_inventory',
            resultType: 'conversation_inventory_item',
            dataOrigin: sampleDataUsed ? 'sample_fallback' : 'input_payload',
            threadId: thread.threadId || `thread-${index + 1}`,
            surface: normalizeSurface(thread.surface),
            threadUrl: thread.threadUrl || null,
            buyerName: thread.buyerName || null,
            listingTitle: thread.listingTitle || null,
            buyerIntent: inferBuyerIntent(thread),
            status: thread.status || 'unclassified',
            lastMessageAt: thread.lastMessageAt || null,
            daysSinceLastMessage: getThreadAgeDays(thread),
            lastMessage: thread.lastMessage || null,
            recommendedAction: action.recommendedAction,
            priority: action.priority,
            reason: action.reason,
            sampleDataUsed,
        };
    });
}

function buildReplyQueue(input, sampleDataUsed) {
    const style = input.replyStyle || 'concise_friendly';
    const template = input.replyTemplate;
    const threads = Array.isArray(input.threads) ? input.threads : [];

    return threads.map((thread, index) => {
        const action = classifyReplyAction(thread);
        const replyDraft = template
            ? renderTemplate(template, {
                buyerName: thread.buyerName || 'hola',
                listingTitle: thread.listingTitle || 'el producto',
                price: thread.price || '',
                city: thread.city || '',
            })
            : getReplyTone(style, thread);

        return {
            mode: 'build_reply_queue',
            resultType: 'reply_queue_item',
            dataOrigin: sampleDataUsed ? 'sample_fallback' : 'input_payload',
            threadId: thread.threadId || `thread-${index + 1}`,
            surface: normalizeSurface(thread.surface),
            threadUrl: thread.threadUrl || null,
            buyerName: thread.buyerName || null,
            listingTitle: thread.listingTitle || null,
            buyerIntent: inferBuyerIntent(thread),
            status: thread.status || 'unclassified',
            lastMessageAt: thread.lastMessageAt || null,
            daysSinceLastMessage: getThreadAgeDays(thread),
            lastMessage: thread.lastMessage || null,
            recommendedAction: action.recommendedAction,
            priority: action.priority,
            replyDraft,
            reason: action.reason,
            sampleDataUsed,
        };
    });
}

function buildFollowUpQueue(input, sampleDataUsed) {
    const style = input.replyStyle || 'concise_friendly';
    const threshold = Number(input.followUpDaysThreshold || 20);
    const threads = Array.isArray(input.threads) ? input.threads : [];

    return threads
        .map((thread, index) => {
            const daysSinceLastMessage = getThreadAgeDays(thread);
            const followUpWindowReached = daysSinceLastMessage >= threshold;
            if (!followUpWindowReached) return null;

            return {
                mode: 'build_follow_up_queue',
                resultType: 'follow_up_queue_item',
                dataOrigin: sampleDataUsed ? 'sample_fallback' : 'input_payload',
                threadId: thread.threadId || `thread-${index + 1}`,
                surface: normalizeSurface(thread.surface),
                threadUrl: thread.threadUrl || null,
                buyerName: thread.buyerName || null,
                listingTitle: thread.listingTitle || null,
                buyerIntent: inferBuyerIntent(thread),
                status: thread.status || 'needs_follow_up',
                lastMessageAt: thread.lastMessageAt || null,
                daysSinceLastMessage,
                lastMessage: thread.lastMessage || null,
                followUpWindowReached,
                recommendedAction: 'send_follow_up',
                priority: daysSinceLastMessage >= (threshold + 10) ? 'high' : 'medium',
                replyDraft: input.followUpUseCase === 'room_rental'
                    ? getRentalFollowUpDraft(input, thread)
                    : getFollowUpDraft(style, thread),
                reason: `Thread is older than the configured ${threshold}-day follow-up threshold.`,
                sampleDataUsed,
                unreadCount: Number(thread.unreadCount || 0),
                listingId: thread.listingId || null,
            };
        })
        .filter(Boolean);
}

async function buildOrSendFollowUpBatch(input, sampleDataUsed) {
    const maxMessages = clampNumber(input.maxMessages, 1, 200, 40);
    const onlyUnread = input.onlyUnread === true;
    const includeZeroUnread = input.includeZeroUnread === true;
    const minDays = Number(input.minDaysSinceLastMessage || input.followUpDaysThreshold || 20);
    const write = input.write === true || input.sendWrite === true;

    const queued = buildFollowUpQueue({
        ...input,
        followUpDaysThreshold: minDays,
    }, sampleDataUsed)
        .filter((item) => !shouldSkipFollowUpThread(item, input))
        .filter((item) => includeZeroUnread || !onlyUnread || Number(item.unreadCount || 0) > 0)
        .sort((a, b) => {
            const unreadDelta = Number(b.unreadCount || 0) - Number(a.unreadCount || 0);
            if (unreadDelta !== 0) return unreadDelta;
            return Number(b.daysSinceLastMessage || 0) - Number(a.daysSinceLastMessage || 0);
        })
        .slice(0, maxMessages);

    if (!write) {
        return queued.map((item, index) => ({
            ...item,
            mode: 'send_follow_up_batch',
            resultType: 'follow_up_batch_item',
            batchIndex: index + 1,
            batchStatus: 'planned',
            writeAttempted: false,
            backendUsed: null,
            workflowReadiness: 'follow_up_batch_planned',
            reason: 'Batch follow-up item prepared. Pass write=true to attempt sending it programmatically.',
        }));
    }

    const results = [];
    for (const item of queued) {
        const sendResults = await sendMarketplaceReply({
            ...input,
            threadId: item.threadId,
            listingId: item.listingId,
            message: item.replyDraft,
        });
        const sendResult = sendResults[0] || {};
        results.push({
            ...item,
            mode: 'send_follow_up_batch',
            resultType: 'follow_up_batch_item',
            batchIndex: results.length + 1,
            batchStatus: sendResult.status === 'submitted' ? 'sent' : 'failed',
            writeAttempted: true,
            backendUsed: sendResult.backendUsed || null,
            workflowReadiness: sendResult.workflowReadiness || 'follow_up_batch_send_failed',
            apiErrorCode: sendResult.apiErrorCode || null,
            fbtraceId: sendResult.fbtraceId || null,
            errorMessage: sendResult.errorMessage || null,
            rawResponse: sendResult.rawResponse || null,
        });
    }

    return results;
}

function buildListingOpsPlan(input, sampleDataUsed) {
    const listings = Array.isArray(input.listings) ? input.listings : [];

    return listings.map((listing, index) => {
        const daysLive = Number(listing.daysLive || 0);
        const messages = Number(listing.messages || 0);
        const favorites = Number(listing.favorites || 0);

        let recommendedAction = 'keep_running';
        let priority = 'low';
        let reason = 'Listing has normal engagement.';

        if (daysLive >= 14 && messages === 0) {
            recommendedAction = 'reprice_or_refresh';
            priority = 'high';
            reason = 'Listing has been live for two weeks with no messages.';
        } else if (favorites >= 10 && messages === 0) {
            recommendedAction = 'improve_description_or_reply_speed';
            priority = 'medium';
            reason = 'High save interest but weak conversion into messages.';
        } else if (messages >= 5) {
            recommendedAction = 'prioritize_buyer_management';
            priority = 'high';
            reason = 'Listing is generating buyer demand and needs active handling.';
        }

        return {
            mode: 'listing_ops_plan',
            resultType: 'listing_ops_item',
            dataOrigin: sampleDataUsed ? 'sample_fallback' : 'input_payload',
            listingId: listing.listingId || `listing-${index + 1}`,
            listingTitle: listing.title || null,
            recommendedAction,
            priority,
            reason,
            sampleDataUsed,
        };
    });
}

function auditSession(input) {
    const cookies = parseCookiesJson(input.cookiesJson || '');
    const { presentCookies, missingCookies, hasRequiredCookies, optionalSignals } = getRequiredCookieState(cookies);
    const candidateWorkflows = hasRequiredCookies ? CANDIDATE_BROWSER_WORKFLOWS : [];
    const authProofLevel = hasRequiredCookies ? 'cookie_artifact_only' : 'insufficient_cookie_artifact';

    return [{
        mode: 'session_audit',
        resultType: 'session_audit',
        dataOrigin: 'input_payload',
        hasRequiredCookies,
        presentCookies: [...presentCookies, ...optionalSignals],
        missingCookies,
        authProofLevel,
        supportedWorkflows: [],
        candidateWorkflows,
        workflowReadiness: hasRequiredCookies
            ? 'needs_live_browser_verification'
            : 'missing_required_cookies',
        recommendedAction: hasRequiredCookies
            ? 'verify_live_browser_session'
            : 'export_fresh_facebook_cookies',
        sampleDataUsed: false,
    }];
}

async function fetchLiveSellerThreads(input) {
    const liveBackend = input.liveBackend || 'auto';
    const cookies = parseCookiesJson(input.cookiesJson || '');
    const { presentCookies, missingCookies, hasRequiredCookies, optionalSignals } = getRequiredCookieState(cookies);

    const maxPages = clampNumber(input.maxPages, 1, 40, 5);
    const pageSize = clampNumber(input.pageSize, 1, 12, 12);

    if (liveBackend === 'auto' || liveBackend === 'pp_cli') {
        try {
            const ppCliResult = await fetchLiveSellerThreadsViaPpCli(input, maxPages, pageSize);
            return ppCliResult.items.map((item) => ({
                ...item,
                authProofLevel: 'pp_cli_browser_session_seller_threads',
                workflowReadiness: 'live_seller_threads_verified',
                fbDtsgSource: 'pp_cli_browser_session',
                browserProof: ppCliResult.browserProof,
                presentCookies: hasRequiredCookies ? [...presentCookies, ...optionalSignals] : [],
                supportedWorkflows: LIVE_SELLER_THREADS_WORKFLOWS,
                candidateWorkflows: CANDIDATE_BROWSER_WORKFLOWS,
            }));
        } catch (error) {
            if (liveBackend === 'pp_cli') throw error;
            input.log?.warn?.(`pp_cli backend failed, falling back: ${error.message}`);
        }
    }

    if (!hasRequiredCookies) {
        throw new Error(`fetch_live_seller_threads requires either configured facebook-marketplace-pp-cli auth or Facebook cookies: missing ${missingCookies.join(', ') || 'unknown'}.`);
    }

    if (liveBackend === 'auto' || liveBackend === 'browser_cdp') {
        const cdpResult = await fetchLiveSellerThreadsViaCdp(input, cookies, maxPages, pageSize);
        if (cdpResult) {
            return cdpResult.items.map((item) => ({
                ...item,
                browserProof: cdpResult.browserProof,
                presentCookies: [...presentCookies, ...optionalSignals],
                supportedWorkflows: LIVE_SELLER_THREADS_WORKFLOWS,
                candidateWorkflows: CANDIDATE_BROWSER_WORKFLOWS,
            }));
        }
        if (liveBackend === 'browser_cdp') {
            throw new Error('browser_cdp backend requires browserCdpUrl, cdpUrl, or cdpEndpoint.');
        }
    }

    if (liveBackend === 'direct_http' || liveBackend === 'auto') {
        return fetchLiveSellerThreadsViaDirectHttp(input, cookies, maxPages, pageSize, presentCookies, optionalSignals);
    }

    throw new Error(`Unsupported liveBackend: ${liveBackend}`);
}

async function fetchLiveSellerThreadsViaPpCli(input, maxPages, pageSize) {
    const items = [];
    let pageNumber = 1;
    let cursor = null;
    let hasNextPage = true;

    while (pageNumber <= maxPages && hasNextPage) {
        const firstPage = pageNumber === 1;
        const args = firstPage
            ? ['inbox', 'seller-threads', '--agent', '--no-cache']
            : [
                'inbox',
                'seller-threads-page',
                '--agent',
                '--no-cache',
                '--variables',
                JSON.stringify({ count: pageSize, cursor, filterLabels: null, lookBackInDays: null }),
            ];
        const json = await runPpCli(args, input);
        const connection = getSellerThreadConnection(json);
        const pageItems = connection.edges
            .map((edge) => mapLiveSellerThread(edge, pageNumber))
            .filter((item) => item.threadId || item.buyerName || item.listingTitle || item.lastMessage);

        items.push(...pageItems);
        cursor = connection.page_info?.end_cursor || connection.pageInfo?.endCursor || connection.edges.at(-1)?.cursor || null;
        hasNextPage = Boolean(connection.page_info?.has_next_page ?? connection.pageInfo?.hasNextPage ?? cursor);
        if (pageItems.length === 0 || !cursor) break;
        pageNumber += 1;
    }

    return {
        items,
        browserProof: {
            backend: 'facebook-marketplace-pp-cli',
            sessionProof: 'doctor_validated_browser_session',
        },
    };
}

async function sendMarketplaceReply(input) {
    const threadId = input.threadId || input.replyThreadId;
    const message = input.message || input.replyMessage;
    const listingId = input.listingId || input.replyListingId;
    const writeBackend = input.writeBackend || 'auto';

    if (!threadId || !message) {
        throw new Error('send_reply requires threadId and message.');
    }

    const cookies = parseCookiesJson(input.cookiesJson || '');
    const { hasRequiredCookies } = getRequiredCookieState(cookies);

    if ((writeBackend === 'auto' || writeBackend === 'direct_http') && hasRequiredCookies) {
        try {
            const context = await fetchFacebookContext(cookies, input);
            let buyerId = input.buyerId || input.recipientId || null;

            if (!buyerId) {
                const threadRows = await fetchLiveSellerThreadsViaDirectHttp(
                    input,
                    cookies,
                    clampNumber(input.sendDiscoveryMaxPages, 1, 10, 4),
                    clampNumber(input.sendDiscoveryPageSize, 1, 20, 12),
                    [],
                    [],
                );
                buyerId = threadRows.find((row) => String(row.threadId) === String(threadId))?.buyerId || null;
            }

            const json = await sendFacebookMessage({
                context,
                threadId: String(threadId),
                buyerId: buyerId ? String(buyerId) : null,
                message: String(message),
                input,
            });

            return [{
                mode: 'send_reply',
                resultType: 'reply_send_result',
                threadId: String(threadId),
                listingId: listingId ? String(listingId) : null,
                buyerId: buyerId ? String(buyerId) : null,
                replyDraft: String(message),
                status: 'submitted',
                priority: 'low',
                authProofLevel: 'direct_http_cookie_send',
                workflowReadiness: 'reply_submitted',
                dataOrigin: 'input_payload',
                sampleDataUsed: false,
                writeAttempted: true,
                backendUsed: 'direct_http',
                rawResponse: json,
                reason: 'Cookie-backed messaging/send accepted the reply request.',
            }];
        } catch (directError) {
            if (writeBackend === 'direct_http') {
                return [{
                    mode: 'send_reply',
                    resultType: 'reply_send_result',
                    threadId: String(threadId),
                    listingId: listingId ? String(listingId) : null,
                    replyDraft: String(message),
                    status: 'failed',
                    priority: 'high',
                    authProofLevel: 'direct_http_cookie_send',
                    workflowReadiness: 'direct_http_send_failed',
                    dataOrigin: 'input_payload',
                    sampleDataUsed: false,
                    writeAttempted: true,
                    backendUsed: 'direct_http',
                    errorMessage: String(directError.message || directError),
                    reason: 'Cookie-backed messaging/send failed before a reply could be confirmed.',
                }];
            }
            input.log?.warn?.(`direct_http send failed, falling back to pp_cli: ${directError.message}`);
        }
    }

    const args = [
        'reply',
        '--agent',
        '--write',
        '--thread',
        String(threadId),
        '--message',
        String(message),
    ];
    if (listingId) {
        args.push('--listing', String(listingId));
    }

    let json = null;
    let cliError = null;
    try {
        json = await runPpCli(args, input);
    } catch (error) {
        cliError = error;
    }
    const firstError = Array.isArray(json?.errors) ? json.errors[0] : null;
    const cliErrorMessage = cliError ? String(cliError.message || cliError) : null;
    const doctorRefreshRequired = cliErrorMessage?.includes('doctor pass is older than 30m0s');
    const sqliteBusy = cliErrorMessage?.includes('SQLITE_BUSY') || cliErrorMessage?.includes('database is locked');

    return [{
        mode: 'send_reply',
        resultType: 'reply_send_result',
        threadId: String(threadId),
        listingId: listingId ? String(listingId) : null,
        replyDraft: String(message),
        status: firstError || cliError ? 'failed' : 'submitted',
        priority: firstError || cliError ? 'high' : 'low',
        authProofLevel: 'pp_cli_write_gate',
        workflowReadiness: firstError
            ? 'reply_mutation_failed'
            : doctorRefreshRequired
                ? 'pp_cli_doctor_refresh_required'
                : sqliteBusy
                    ? 'pp_cli_sqlite_busy'
                    : cliError
                        ? 'pp_cli_command_failed'
                        : 'reply_submitted',
        dataOrigin: 'input_payload',
        sampleDataUsed: false,
        writeAttempted: true,
        backendUsed: 'pp_cli',
        apiErrorCode: firstError?.code ?? firstError?.api_error_code ?? null,
        fbtraceId: firstError?.fbtrace_id ?? null,
        errorSummary: firstError?.summary ?? null,
        errorMessage: firstError?.message ?? cliErrorMessage ?? null,
        rawResponse: json,
        reason: firstError
            ? 'facebook-marketplace-pp-cli reached Facebook write endpoint, but Facebook rejected the reply mutation payload.'
            : doctorRefreshRequired
                ? 'facebook-marketplace-pp-cli refused to write because doctor freshness expired.'
                : sqliteBusy
                    ? 'facebook-marketplace-pp-cli local state was locked during the write attempt.'
                    : cliError
                        ? 'facebook-marketplace-pp-cli failed before Facebook accepted the write mutation.'
                        : 'facebook-marketplace-pp-cli write gate accepted and submitted the reply mutation.',
    }];
}

async function fetchLiveSellerThreadsViaDirectHttp(input, cookies, maxPages, pageSize, presentCookies, optionalSignals) {
    const { cookieHeader, fbDtsg, fbDtsgSource } = await fetchFacebookContext(cookies, input);
    const items = [];
    let pageNumber = 1;
    let cursor = null;
    let hasNextPage = true;

    while (pageNumber <= maxPages && hasNextPage) {
        const isFirstPage = pageNumber === 1;
        const json = await facebookGraphql({
            cookieHeader,
            fbDtsg,
            docId: isFirstPage ? SELLER_THREAD_INITIAL_DOC_ID : SELLER_THREAD_PAGINATION_DOC_ID,
            friendlyName: isFirstPage ? SELLER_THREAD_INITIAL_FRIENDLY_NAME : SELLER_THREAD_PAGINATION_FRIENDLY_NAME,
            variables: isFirstPage
                ? { filterLabels: null, lookBackInDays: null }
                : { count: pageSize, cursor, filterLabels: null, lookBackInDays: null },
            input,
        });
        const connection = getSellerThreadConnection(json);
        const pageItems = connection.edges
            .map((edge) => mapLiveSellerThread(edge, pageNumber))
            .filter((item) => item.threadId || item.buyerName || item.listingTitle || item.lastMessage);

        items.push(...pageItems);
        cursor = connection.page_info?.end_cursor || connection.pageInfo?.endCursor || connection.edges.at(-1)?.cursor || null;
        hasNextPage = Boolean(connection.page_info?.has_next_page ?? connection.pageInfo?.hasNextPage ?? cursor);

        if (pageItems.length === 0 || !cursor) break;
        pageNumber += 1;
    }

    return items.map((item) => ({
        ...item,
        fbDtsgSource,
        presentCookies: [...presentCookies, ...optionalSignals],
        supportedWorkflows: LIVE_SELLER_THREADS_WORKFLOWS,
        candidateWorkflows: CANDIDATE_BROWSER_WORKFLOWS,
    }));
}

export async function runActorMode(rawInput = {}) {
    const mode = rawInput.mode || 'build_reply_queue';
    const { enriched, sampleDataUsed } = withSampleData(rawInput);

    let items;
    if (mode === 'conversation_inventory') {
        items = buildConversationInventory(enriched, sampleDataUsed);
    } else if (mode === 'build_reply_queue') {
        items = buildReplyQueue(enriched, sampleDataUsed);
    } else if (mode === 'build_follow_up_queue') {
        items = buildFollowUpQueue(enriched, sampleDataUsed);
    } else if (mode === 'send_follow_up_batch') {
        items = await buildOrSendFollowUpBatch(enriched, sampleDataUsed);
    } else if (mode === 'listing_ops_plan') {
        items = buildListingOpsPlan(enriched, sampleDataUsed);
    } else if (mode === 'session_audit') {
        items = auditSession(enriched);
    } else if (mode === 'fetch_live_seller_threads') {
        items = await fetchLiveSellerThreads(enriched);
    } else if (mode === 'send_reply') {
        items = await sendMarketplaceReply(enriched);
    } else {
        throw new Error(`Unsupported mode: ${mode}`);
    }

    const summary = {
        resultTypes: Object.fromEntries(
            [...new Set(items.map((item) => item.resultType))].map((resultType) => [
                resultType,
                items.filter((item) => item.resultType === resultType).length,
            ]),
        ),
        highPriority: items.filter((item) => item.priority === 'high').length,
        mediumPriority: items.filter((item) => item.priority === 'medium').length,
        lowPriority: items.filter((item) => item.priority === 'low').length,
        sampleDataUsed,
    };

    return { mode, items, summary, sampleDataUsed };
}

export function withDefaultCookies(input = {}, env = process.env) {
    if (input.cookiesJson && String(input.cookiesJson).trim()) return input;
    const envCookies = env.FACEBOOK_COOKIES_JSON || env.FB_COOKIES_JSON || '';
    if (!String(envCookies).trim()) return input;
    return {
        ...input,
        cookiesJson: envCookies,
    };
}

import { Actor } from 'apify';

const REQUIRED_COOKIES = ['c_user', 'xs', 'datr', 'sb', 'fr'];
const OPTIONAL_SIGNAL_COOKIES = ['presence', 'wd'];

function parseCookiesJson(raw) {
    if (!raw || !raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
        throw new Error('cookiesJson must be a JSON array of cookie objects.');
    }
    return parsed;
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
        premium_trust_building: 'Hola {{buyerName}}, gracias por escribir. {{listingTitle}} sigue disponible y esta listo para entrega en {{city}}. Si quieres, te paso detalles y cerramos horario.'
    };
    const marketplaceReply = renderTemplate(templates[style] || templates.concise_friendly, {
        buyerName: thread.buyerName || 'hola',
        listingTitle: thread.listingTitle || 'el producto',
        city
    });
    if (surface === 'messenger_direct' || surface === 'messenger_group') {
        return renderTemplate('Hola {{buyerName}}, te escribo para retomar la conversacion. Si todavia te interesa {{listingTitle}}, te paso disponibilidad actualizada.', {
            buyerName: thread.buyerName || 'hola',
            listingTitle: thread.listingTitle || 'el producto'
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
            listingTitle
        });
    }

    const directTemplate = style === 'firm_fast_close'
        ? 'Hola {{buyerName}}, cierro este hilo si ya no te interesa {{listingTitle}}. Si sigues interesado, te digo disponibilidad hoy mismo.'
        : 'Hola {{buyerName}}, reabro el hilo por si sigues interesado en {{listingTitle}}. Han pasado {{days}} dias desde el ultimo mensaje y te actualizo disponibilidad si te viene bien.';

    return renderTemplate(directTemplate, { buyerName, listingTitle, days });
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

function buildConversationInventory(input) {
    const threads = Array.isArray(input.threads) ? input.threads : [];

    return threads.map((thread, index) => {
        const action = classifyReplyAction(thread);
        return {
            mode: 'conversation_inventory',
            resultType: 'conversation_inventory_item',
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
            reason: action.reason
        };
    });
}

function buildReplyQueue(input) {
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
                city: thread.city || ''
            })
            : getReplyTone(style, thread);

        return {
            mode: 'build_reply_queue',
            resultType: 'reply_queue_item',
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
            reason: action.reason
        };
    });
}

function buildFollowUpQueue(input) {
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
                replyDraft: getFollowUpDraft(style, thread),
                reason: `Thread is older than the configured ${threshold}-day follow-up threshold.`
            };
        })
        .filter(Boolean);
}

function buildListingOpsPlan(input) {
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
            listingId: listing.listingId || `listing-${index + 1}`,
            listingTitle: listing.title || null,
            recommendedAction,
            priority,
            reason
        };
    });
}

function auditSession(input) {
    const cookies = parseCookiesJson(input.cookiesJson || '');
    const names = new Set(cookies.map((cookie) => cookie.name).filter(Boolean));
    const presentCookies = REQUIRED_COOKIES.filter((name) => names.has(name));
    const missingCookies = REQUIRED_COOKIES.filter((name) => !names.has(name));
    const hasRequiredCookies = missingCookies.length === 0;
    const optionalSignals = OPTIONAL_SIGNAL_COOKIES.filter((name) => names.has(name));
    const supportedWorkflows = hasRequiredCookies
        ? [
            'browser_backed_marketplace_reply',
            'browser_backed_inbox_review',
            'browser_backed_listing_ops'
        ]
        : [];

    return [{
        mode: 'session_audit',
        resultType: 'session_audit',
        hasRequiredCookies,
        presentCookies: [...presentCookies, ...optionalSignals],
        missingCookies,
        supportedWorkflows,
        recommendedAction: hasRequiredCookies
            ? 'session_ready_for_browser_worker'
            : 'export_fresh_facebook_cookies'
    }];
}

await Actor.init();

const input = (await Actor.getInput()) || {};
const mode = input.mode || 'build_reply_queue';

let items;
if (mode === 'conversation_inventory') {
    items = buildConversationInventory(input);
} else if (mode === 'build_reply_queue') {
    items = buildReplyQueue(input);
} else if (mode === 'build_follow_up_queue') {
    items = buildFollowUpQueue(input);
} else if (mode === 'listing_ops_plan') {
    items = buildListingOpsPlan(input);
} else if (mode === 'session_audit') {
    items = auditSession(input);
} else {
    throw new Error(`Unsupported mode: ${mode}`);
}

for (const item of items) {
    await Actor.pushData(item);
}

await Actor.setValue('OUTPUT', {
    mode,
    resultCount: items.length,
    summary: {
        resultTypes: Object.fromEntries(
            [...new Set(items.map((item) => item.resultType))].map((resultType) => [
                resultType,
                items.filter((item) => item.resultType === resultType).length
            ])
        ),
        highPriority: items.filter((item) => item.priority === 'high').length,
        mediumPriority: items.filter((item) => item.priority === 'medium').length,
        lowPriority: items.filter((item) => item.priority === 'low').length
    },
    defaultDatasetUrl: '{{links.apiDefaultDatasetUrl}}/items'
});

await Actor.exit();

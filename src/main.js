import { Actor } from 'apify';

const REQUIRED_COOKIES = ['c_user', 'xs', 'datr', 'sb', 'fr'];

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

function inferBuyerIntent(thread) {
    const explicitIntent = (thread.buyerIntent || '').trim().toLowerCase();
    if (explicitIntent) return explicitIntent;

    const lastMessage = (thread.lastMessage || '').toLowerCase();
    if (lastMessage.includes('disponible')) return 'availability';
    if (lastMessage.includes('rebaja') || lastMessage.includes('dejas') || lastMessage.includes('precio')) return 'negotiation';
    if (lastMessage.includes('hoy') || lastMessage.includes('manana') || lastMessage.includes('mañana') || lastMessage.includes('recoger')) return 'pickup';
    return 'general_interest';
}

function getReplyTone(style, thread) {
    const city = thread.city || 'tu zona';
    const templates = {
        concise_friendly: 'Hola {{buyerName}}, sigue disponible {{listingTitle}}. Si te encaja, puedo cerrar entrega hoy en {{city}}.',
        firm_fast_close: 'Hola {{buyerName}}, {{listingTitle}} sigue disponible. Si te interesa de verdad, te confirmo recogida hoy en {{city}}.',
        premium_trust_building: 'Hola {{buyerName}}, gracias por escribir. {{listingTitle}} sigue disponible y esta listo para entrega en {{city}}. Si quieres, te paso detalles y cerramos horario.'
    };
    return renderTemplate(templates[style] || templates.concise_friendly, {
        buyerName: thread.buyerName || 'hola',
        listingTitle: thread.listingTitle || 'el producto',
        city
    });
}

function classifyReplyAction(thread) {
    const intent = inferBuyerIntent(thread);
    const hours = Number(thread.hoursSinceLastMessage || 0);

    if (intent.includes('availability')) {
        return { recommendedAction: 'reply_now', priority: hours <= 2 ? 'high' : 'medium', reason: 'Fresh buyer message with availability intent' };
    }
    if (intent.includes('negotiation')) {
        return { recommendedAction: 'counter_or_hold', priority: 'medium', reason: 'Negotiation message should be answered with a bounded seller stance' };
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
            buyerName: thread.buyerName || null,
            listingTitle: thread.listingTitle || null,
            buyerIntent: inferBuyerIntent(thread),
            status: thread.status || 'unclassified',
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
            buyerName: thread.buyerName || null,
            listingTitle: thread.listingTitle || null,
            buyerIntent: inferBuyerIntent(thread),
            status: thread.status || 'unclassified',
            lastMessage: thread.lastMessage || null,
            recommendedAction: action.recommendedAction,
            priority: action.priority,
            replyDraft,
            reason: action.reason
        };
    });
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

    return [{
        mode: 'session_audit',
        resultType: 'session_audit',
        hasRequiredCookies,
        presentCookies,
        missingCookies,
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

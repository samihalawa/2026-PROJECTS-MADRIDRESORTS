import { runActorMode } from '../src/core.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const reply = await runActorMode({ mode: 'build_reply_queue' });
assert(reply.items.length >= 2, 'Expected sample-backed reply queue rows.');
assert(reply.sampleDataUsed === true, 'Expected sample data fallback on empty reply-queue input.');
assert(reply.items.some((item) => item.surface === 'marketplace_seller'), 'Expected marketplace_seller reply row.');

const followUp = await runActorMode({ mode: 'build_follow_up_queue', followUpDaysThreshold: 20 });
assert(followUp.items.length >= 2, 'Expected follow-up queue rows from sample data.');
assert(followUp.items.every((item) => item.followUpWindowReached === true), 'Expected all follow-up rows to cross threshold.');

const listingOps = await runActorMode({ mode: 'listing_ops_plan' });
assert(listingOps.items.length >= 2, 'Expected sample-backed listing ops rows.');
assert(listingOps.items.some((item) => item.recommendedAction === 'prioritize_buyer_management'), 'Expected active demand listing action.');

const audit = await runActorMode({
    mode: 'session_audit',
    cookiesJson: JSON.stringify([
        { name: 'c_user' },
        { name: 'xs' },
        { name: 'datr' },
        { name: 'sb' },
        { name: 'fr' },
        { name: 'presence' },
        { name: 'wd' },
    ]),
});
assert(audit.items[0].hasRequiredCookies === true, 'Expected required cookies to pass.');
assert(audit.items[0].supportedWorkflows.length === 0, 'Expected supportedWorkflows to stay empty until live auth is proven.');
assert(audit.items[0].candidateWorkflows.includes('browser_backed_marketplace_reply'), 'Expected marketplace workflow candidate support.');
assert(audit.items[0].workflowReadiness === 'needs_live_browser_verification', 'Expected conservative workflow readiness state.');
assert(audit.items[0].recommendedAction === 'verify_live_browser_session', 'Expected live-browser verification action.');

let liveModeMissingCookieError = null;
try {
    await runActorMode({
        mode: 'fetch_live_seller_threads',
        cookiesJson: JSON.stringify([{ name: 'c_user', value: 'test-user' }]),
    });
} catch (error) {
    liveModeMissingCookieError = error;
}

assert(liveModeMissingCookieError, 'Expected live mode to reject incomplete cookie input.');
assert(liveModeMissingCookieError.message.includes('missing xs'), 'Expected live mode missing-cookie error to name xs.');

console.log(JSON.stringify({
    replyRows: reply.items.length,
    followUpRows: followUp.items.length,
    listingRows: listingOps.items.length,
    sessionAudit: audit.items[0],
    liveModeMissingCookieError: liveModeMissingCookieError.message,
}, null, 2));

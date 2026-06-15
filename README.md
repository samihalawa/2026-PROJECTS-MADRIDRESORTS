## What does Facebook Marketplace Seller Manager do?

Facebook Marketplace Seller Manager is a Marketplace-first management Actor for sellers who need to audit session readiness, organize buyer conversations, build reply queues, reactivate stale threads, and prioritize listing actions. It is intentionally not a generic Facebook scraper and not a broad Facebook bundle.

The current Apify Store is already crowded for general Facebook Groups scraping and Facebook Marketplace listing extraction. The stronger product angle is a seller workflow layer: inbox triage, reply drafting, stale follow-ups, listing operations planning, and later authenticated inbox and listing actions.

## Why this Actor exists

- Marketplace scraping is crowded. Seller management is the cleaner gap.
- Sellers care about response speed, stale listings, lead handling, and repeatable workflows.
- Seller inbox work is not just scraping. The durable value is deciding who to answer, who to follow up, and which listing needs action next.
- "General Facebook management" is too broad for SEO and too messy for a first Store launch.
- Apify's own bundle guidance says bundles are harder to market from search intent than a focused Actor.

## Best product scope

This Actor should ship as a focused seller workflow tool:

- Audit whether imported Facebook session cookies are management-ready.
- Fetch live Marketplace seller conversations from an authenticated cookie export.
- Turn buyer conversations into a reply queue with structured actions.
- Turn older conversations into follow-up campaigns once they cross a stale threshold.
- Turn listing inventory into an operations queue: follow up, bump, archive, relist, mark sold.
- Model both Marketplace seller threads and related Messenger follow-up lanes without turning the Store page into a generic Facebook bundle.
- Keep public search/monitoring as a companion feature, not the core identity.

## Gowa-style architecture

The right long-term shape is Gowa-like internally, but not as one bloated Store page.

Split the concept into separate tools:

- `auth-session-audit`: validate whether exported Facebook session artifacts are usable.
- `conversation-inventory`: normalize prior seller threads into structured rows.
- `reply-queue-builder`: turn conversations into recommended replies and action queues.
- `follow-up-campaign-builder`: select older threads and generate reactivation messages.
- `listing-ops-worker`: decide which listings need refresh, repricing, archive, or sold-state handling.
- `public-market-monitor`: optional companion tool for public Marketplace discovery and watchlists.

Public product strategy:

- Launch one focused Actor first: `Facebook Marketplace Seller Manager`.
- Keep the other tools as internal modules, future modes, or later companion Actors.
- Do not publish a broad `facebook-manager` umbrella until there is proven demand for each surface.

Do not lead with groups, pages, ads, or broad Facebook automation in the first launch. Those are separate products with different demand and competition profiles.

## Best final approach

The best commercial approach is:

1. Public Actor: `Facebook Marketplace Seller Manager`
2. Internal architecture: Gowa-like module split
3. Product promise: seller management, not scrape-only

This gives you the cleanest search intent and the broadest useful workflow without making the first release vague.

### Why this beats the alternatives

| Approach | Verdict |
|---|---|
| Broad `facebook-manager` | Too wide, weak SEO, too many auth surfaces at once |
| Scraper-only Marketplace Actor | Crowded, easy to copy, lower workflow value |
| Messenger-only library product | Valuable internally, weaker Store positioning |
| Marketplace-first seller manager | Best first commercial surface |

### Relation to a Gowa equivalent

Gowa is flexible because it offers a stable session-backed messaging core. The closest product strategy here is:

- keep the public commercial page narrow;
- keep the internal execution model session-backed and modular;
- let later companion actors or internal workers handle adjacent surfaces.

So the best equivalent is not "build one public Facebook Gowa clone first". It is "launch one focused commercial Marketplace manager that sits on top of a reusable inbox/session core."

## Current MVP in this repo

This repo ships a runnable management MVP with six modes:

1. `conversation_inventory`
2. `build_reply_queue`
3. `build_follow_up_queue`
4. `listing_ops_plan`
5. `fetch_live_seller_threads`
6. `session_audit`

Default input uses `build_reply_queue`, and built-in sample data is enabled when relevant arrays are empty so the Actor produces deterministic non-empty output for Store QA and first-run validation. The authenticated `fetch_live_seller_threads` mode uses exported Facebook cookies to fetch real Marketplace seller conversations and normalize them into the same management row shape. Every management row exposes `sampleDataUsed` plus `dataOrigin`, so sample-backed QA output is visibly separated from input-derived production output.

## Production-ready operator surface

This repo now includes:

- a reusable core runner in [src/core.js](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/src/core.js)
- the thin Apify entrypoint in [src/main.js](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/src/main.js)
- a local JSON runner in [scripts/run-local.mjs](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/scripts/run-local.mjs)
- actor validation in [scripts/validate-actor.mjs](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/scripts/validate-actor.mjs)
- Apify control-plane inspection in [scripts/apify-doctor.mjs](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/scripts/apify-doctor.mjs)
- Git-backed source promotion in [scripts/promote-git-source.mjs](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/scripts/promote-git-source.mjs)

Run the production check locally with:

```bash
npm run check
```

Inspect Apify deployment state with:

```bash
npm run doctor:apify
```

If the repo is private, promote the actor with a GitHub token available in `GH_TOKEN` or `GITHUB_TOKEN` so Apify can clone the repository in `GIT_REPO` mode without falling back to stale uploaded source files.

## How to use Facebook Marketplace Seller Manager

1. Choose a mode.
2. Paste sample buyer threads or listing rows.
3. Optionally paste exported Facebook cookies JSON for session auditing or live seller-thread fetching.
4. Run the Actor.
5. Download JSON/CSV output or use it via API in follow-up automations.

## Input

| Field | Type | Required | Description |
|---|---|---:|---|
| `mode` | enum | yes | `conversation_inventory`, `build_reply_queue`, `build_follow_up_queue`, `listing_ops_plan`, `fetch_live_seller_threads`, or `session_audit`. |
| `useSampleData` | boolean | no | Enabled by default so empty-input QA runs still produce deterministic output. |
| `threads` | array | for conversation modes | Conversation rows with `surface`, `threadUrl`, listing title, buyer name, last message, age, and status. |
| `followUpDaysThreshold` | integer | for follow-up mode | Age threshold used to select stale threads for reactivation. |
| `listings` | array | for listing mode | Your active listing rows with title, price, age, favorites, and status. |
| `replyStyle` | enum | no | Tone for generated reply drafts. |
| `replyTemplate` | string | no | Optional custom reply pattern. |
| `cookiesJson` | string | for authenticated modes | Exported `facebook.com` cookies JSON from Cookie-Editor or equivalent. Required for `fetch_live_seller_threads`; optional for `session_audit`. |
| `maxPages` | integer | for live fetch | Maximum seller-inbox pages to fetch. Defaults to 5, capped at 40. |
| `pageSize` | integer | for live fetch | Live seller-inbox page size. Defaults to 12, capped at 12. |
| `fbDtsg` | string | optional for live fetch | Browser-extracted `fb_dtsg` token. Use it when cookies work in a real browser but Facebook home returns an error to server-side requests. |
| `browserCdpUrl` | string | optional for live fetch | Chrome DevTools Protocol endpoint. When supplied, the actor imports cookies into that browser and fetches seller threads from inside the authenticated Facebook page. |
| `browserWaitMs` | integer | optional for CDP live fetch | Wait after browser navigation before extracting Facebook runtime tokens. Defaults to 5000. |

## Output

The default dataset contains management rows instead of raw scrape rows.

### Conversation inventory example

```json
{
  "mode": "conversation_inventory",
  "resultType": "conversation_inventory_item",
  "threadId": "thread-1",
  "buyerName": "Ana",
  "listingTitle": "iPhone 15 Pro 128GB",
  "buyerIntent": "availability",
  "status": "new",
  "recommendedAction": "reply_now",
  "priority": "high",
  "reason": "Fresh buyer message with availability intent"
}
```

### Reply queue item example

```json
{
  "mode": "build_reply_queue",
  "resultType": "reply_queue_item",
  "threadId": "thread-1",
  "surface": "marketplace_seller",
  "buyerName": "Ana",
  "listingTitle": "iPhone 15 Pro 128GB",
  "recommendedAction": "reply_now",
  "priority": "high",
  "replyDraft": "Hola Ana, sigue disponible. Puedo entregarlo hoy en Madrid centro. Si quieres, te confirmo punto y hora.",
  "reason": "Fresh buyer message with availability intent"
}
```

### Follow-up queue item example

```json
{
  "mode": "build_follow_up_queue",
  "resultType": "follow_up_queue_item",
  "threadId": "thread-2",
  "surface": "messenger_direct",
  "buyerName": "Jp Hrez",
  "listingTitle": "Habitacion Madrid",
  "daysSinceLastMessage": 27,
  "followUpWindowReached": true,
  "recommendedAction": "send_follow_up",
  "priority": "medium",
  "replyDraft": "Hola Jp Hrez, reabro el hilo por si sigues interesado en Habitacion Madrid. Han pasado 27 dias desde el ultimo mensaje y te actualizo disponibilidad si te viene bien.",
  "reason": "Thread is older than the configured 20-day follow-up threshold."
}
```

### Session audit example

```json
{
  "mode": "session_audit",
  "resultType": "session_audit",
  "hasRequiredCookies": true,
  "authProofLevel": "cookie_artifact_only",
  "missingCookies": [],
  "presentCookies": ["c_user", "xs", "datr", "sb", "fr", "presence", "wd"],
  "supportedWorkflows": [],
  "candidateWorkflows": [
    "browser_backed_marketplace_reply",
    "browser_backed_inbox_review",
    "browser_backed_listing_ops"
  ],
  "workflowReadiness": "needs_live_browser_verification",
  "recommendedAction": "verify_live_browser_session"
}
```

Important: `session_audit` is intentionally conservative. Cookie presence is treated as a candidate session artifact, not as proven Marketplace authentication. A live authenticated Facebook browser surface still has to be verified before any reply worker, inbox worker, or listing-action worker is considered production-ready.

### Live seller-thread example

```json
{
  "mode": "fetch_live_seller_threads",
  "resultType": "live_seller_thread",
  "dataOrigin": "live_facebook_graphql",
  "authProofLevel": "live_graphql_seller_threads",
  "workflowReadiness": "live_seller_threads_verified",
  "fbDtsgSource": "browser_cdp",
  "browserProof": {
    "title": "(15) Facebook",
    "hasMarketplace": true,
    "hasZimo": true,
    "fbDtsgPresent": true
  },
  "threadId": "930978993297322",
  "surface": "marketplace_seller",
  "threadUrl": "https://www.facebook.com/messages/t/930978993297322",
  "buyerName": "Clara Pazos",
  "listingTitle": "1 bed 1 bath Room only",
  "lastMessageAt": "2026-06-15T11:27:43.348Z",
  "lastMessage": "Perfecto, gracias por la info. Te confirmo en breve.",
  "recommendedAction": "reply_now",
  "priority": "medium"
}
```

`fetch_live_seller_threads` is the first production authenticated mode. It reads seller conversations and prepares management rows. It does not send replies or modify listings yet; those remain later browser-backed action modes.

## How much does it cost?

Recommended first monetization model: Pay per event.

Suggested event design for the real commercial version:

- `reply-queue-item` for each actionable buyer thread produced.
- `follow-up-queue-item` for each stale thread selected for reactivation.
- `listing-op-item` for each actionable listing decision produced.
- `managed-thread-action` later, when authenticated reply execution ships.
- `managed-listing-action` later, when authenticated listing updates ship.

Do not charge for failed auth attempts or empty internal steps.

## Market positioning

Current Store reality:

- General Facebook Groups scraping is dominated by Apify's own actor.
- General Facebook Marketplace scraping is crowded and keyword-heavy.
- Seller-side management is the cleaner gap because it solves a workflow, not just a data pull.
- There is room between pure scraping and a full generic Facebook manager: Marketplace-first inbox operations.

Primary keyword target:

- `facebook marketplace seller manager`

Secondary keywords:

- `facebook marketplace inbox automation`
- `facebook marketplace reply automation`
- `facebook marketplace follow up automation`
- `facebook marketplace seller workflow`
- `facebook marketplace listing manager`
- `facebook marketplace seller assistant`

## Launch strategy

Phase 1:

- Publish this management-first Actor.
- Keep the default run credential-free and deterministic.
- Lead with structured seller operations, not scraping volume.
- Position it around seller operations, not generic Facebook automation.

Phase 2:

- Extend the authenticated seller-thread mode into browser-backed reply execution and listing actions.
- Import cookies, validate session, fetch live seller conversations, and then execute selected replies or listing state changes for authorized sessions.
- If the actor is company-owned, keep the Apify version in `GIT_REPO` mode so future `git push` reaches production. Do not fall back to manual `SOURCE_FILES` drift.

Phase 3:

- Offer a separate companion Actor for public Marketplace search/monitoring.
- Cross-link both Actors instead of turning the first one into a bundle too early.

## Why not a general Facebook manager?

- Weak SEO intent.
- Too many unrelated surfaces: groups, pages, Messenger, Marketplace, comments, ads.
- Harder reliability and lower quality score risk.
- Harder to explain pricing and permissions.

The first commercial win should be a narrow seller workflow Actor with strong terminology, clear defaults, and predictable outputs.

## Future split

If the first Actor gets traction, the best split is:

1. `facebook-marketplace-seller-manager`
2. `facebook-conversation-ops`
3. `facebook-marketplace-public-monitor`

That preserves the Gowa-like flexibility without destroying Store clarity.

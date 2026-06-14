## What does Facebook Marketplace Seller Manager do?

Facebook Marketplace Seller Manager is a management-first Actor for sellers who need to audit session readiness, organize buyer conversations, draft replies, and prioritize listing actions across Marketplace. It is intentionally not a generic Facebook scraper and not a broad Facebook bundle.

The current Apify Store is already crowded for general Facebook Groups scraping and Facebook Marketplace listing extraction. The stronger product angle is a seller workflow layer: inbox triage, reply drafting, listing operations planning, and later authenticated listing/inbox actions.

## Why this Actor exists

- Marketplace scraping is crowded. Seller management is the cleaner gap.
- Sellers care about response speed, stale listings, lead handling, and repeatable workflows.
- "General Facebook management" is too broad for SEO and too messy for a first Store launch.
- Apify's own bundle guidance says bundles are harder to market from search intent than a focused Actor.

## Best product scope

This Actor should ship as a focused seller workflow tool:

- Audit whether imported Facebook session cookies are management-ready.
- Turn buyer conversations into a reply queue with structured actions.
- Turn listing inventory into an operations queue: follow up, bump, archive, relist, mark sold.
- Keep public search/monitoring as a companion feature, not the core identity.

## Gowa-style architecture

The right long-term shape is Gowa-like internally, but not as one bloated Store page.

Split the concept into separate tools:

- `auth-session-audit`: validate whether exported Facebook session artifacts are usable.
- `conversation-inventory`: normalize prior seller threads into structured rows.
- `reply-queue-builder`: turn conversations into recommended replies and action queues.
- `listing-ops-worker`: decide which listings need refresh, repricing, archive, or sold-state handling.
- `public-market-monitor`: optional companion tool for public Marketplace discovery and watchlists.

Public product strategy:

- Launch one focused Actor first: `Facebook Marketplace Seller Manager`.
- Keep the other tools as internal modules, future modes, or later companion Actors.
- Do not publish a broad `facebook-manager` umbrella until there is proven demand for each surface.

Do not lead with groups, pages, ads, or broad Facebook automation in the first launch. Those are separate products with different demand and competition profiles.

## Current MVP in this repo

This repo ships a runnable management MVP with four modes:

1. `conversation_inventory`
2. `build_reply_queue`
3. `listing_ops_plan`
4. `session_audit`

Default input uses `build_reply_queue` so the Actor succeeds without credentials and produces a non-empty dataset for Store QA.

## How to use Facebook Marketplace Seller Manager

1. Choose a mode.
2. Paste sample buyer threads or listing rows.
3. Optionally paste exported Facebook cookies JSON for session auditing.
4. Run the Actor.
5. Download JSON/CSV output or use it via API in follow-up automations.

## Input

| Field | Type | Required | Description |
|---|---|---:|---|
| `mode` | enum | yes | `conversation_inventory`, `build_reply_queue`, `listing_ops_plan`, or `session_audit`. |
| `threads` | array | for conversation or reply modes | Buyer thread rows with listing title, buyer name, last message, and status. |
| `listings` | array | for listing mode | Your active listing rows with title, price, age, favorites, and status. |
| `replyStyle` | enum | no | Tone for generated reply drafts. |
| `replyTemplate` | string | no | Optional custom reply pattern. |
| `cookiesJson` | string | for session audit | Exported `facebook.com` cookies JSON from Cookie-Editor or equivalent. |

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
  "buyerName": "Ana",
  "listingTitle": "iPhone 15 Pro 128GB",
  "recommendedAction": "reply_now",
  "priority": "high",
  "replyDraft": "Hola Ana, sigue disponible. Puedo entregarlo hoy en Madrid centro. Si quieres, te confirmo punto y hora.",
  "reason": "Fresh buyer message with availability intent"
}
```

### Session audit example

```json
{
  "mode": "session_audit",
  "resultType": "session_audit",
  "hasRequiredCookies": true,
  "missingCookies": [],
  "presentCookies": ["c_user", "xs", "datr", "sb", "fr"],
  "recommendedAction": "session_ready_for_browser_worker"
}
```

## How much does it cost?

Recommended first monetization model: Pay per event.

Suggested event design for the real commercial version:

- `reply-queue-item` for each actionable buyer thread produced.
- `listing-op-item` for each actionable listing decision produced.
- `managed-thread-action` later, when authenticated reply execution ships.
- `managed-listing-action` later, when authenticated listing updates ship.

Do not charge for failed auth attempts or empty internal steps.

## Market positioning

Current Store reality:

- General Facebook Groups scraping is dominated by Apify's own actor.
- General Facebook Marketplace scraping is crowded and keyword-heavy.
- Seller-side management is the cleaner gap because it solves a workflow, not just a data pull.

Primary keyword target:

- `facebook marketplace seller manager`

Secondary keywords:

- `facebook marketplace inbox automation`
- `facebook marketplace reply automation`
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

- Add authenticated browser worker modes for seller inbox and listing actions.
- Import cookies, validate session, and execute selected replies or listing state changes.

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

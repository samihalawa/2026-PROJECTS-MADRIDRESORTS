## What does Facebook Marketplace Seller Manager do?

Facebook Marketplace Seller Manager is a Marketplace-first management Actor for sellers who need to audit session readiness, organize buyer conversations, build reply queues, reactivate stale threads, and prioritize listing actions. It is intentionally not a generic Facebook scraper and not a broad Facebook bundle.

The current Apify Store is already crowded for general Facebook Groups scraping and Facebook Marketplace listing extraction. The stronger product angle is a seller workflow layer: inbox triage, reply drafting, stale follow-ups, listing operations planning, and later authenticated inbox and listing actions.

## Current live cookie proof

On 2026-06-19, the repo's direct HTTP live-fetch path was re-verified with a fresh exported `facebook.com` cookie set for `c_user=61579001435313`. The actor returned real Marketplace seller-thread rows, including:

- `1494259919145926` / `Eduardo Escobar`
- `1509637693337627` / `Bruno Oliveira`
- `930978993297322` / `Clara Pazos`

The verified request shape uses the minimal `Mozilla/5.0` user agent for direct HTTP cookie sessions. A Chrome-style user agent had previously triggered Facebook soft failures for the same cookies.

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

This repo ships a runnable management MVP with eight modes:

1. `conversation_inventory`
2. `build_reply_queue`
3. `build_follow_up_queue`
4. `send_follow_up_batch`
5. `listing_ops_plan`
6. `fetch_live_seller_threads`
7. `send_reply`
8. `session_audit`

Default input uses `build_reply_queue`, and built-in sample data is enabled when relevant arrays are empty so the Actor produces deterministic non-empty output for Store QA and first-run validation. The authenticated `fetch_live_seller_threads` mode prefers the configured `facebook-marketplace-pp-cli` browser session, then falls back to browser CDP, then direct HTTP cookies. It fetches real Marketplace seller conversations and normalizes them into the same management row shape. Every management row exposes `sampleDataUsed` plus `dataOrigin`, so sample-backed QA output is visibly separated from input-derived production output.

The new `send_follow_up_batch` mode sits between planning and live writes. With the default `write=false`, it ranks stale threads, generates batch-ready follow-up text, and returns `batchStatus: "planned"` rows. With `write=true`, it reuses the same write-gated reply pathway per thread and records whether each attempt was `sent` or `failed`.

The write-gated `send_reply` mode calls `facebook-marketplace-pp-cli reply --write` and records either the submitted response or the exact Facebook API error. Current live proof shows the CLI reaches Facebook but the packaged `reply` mutation is rejected with `noncoercible_variable_value`, so reply writes are implemented and observable but not yet a verified-success path until the CLI mutation shape is corrected.

## Production-ready operator surface

This repo now includes:

- a reusable core runner in [src/core.js](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/src/core.js)
- the thin Apify entrypoint in [src/main.js](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/src/main.js)
- a thin HTTP service in [src/server.js](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/src/server.js)
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

## Coolify / Gowa-style HTTP runtime

This repo can now run in two modes from the same Dockerfile:

- `FBM_RUNTIME=actor` (default): Apify actor entrypoint
- `FBM_RUNTIME=server`: HTTP API for Coolify / Anchor-adjacent cookie-backed workflows

Server routes:

- `GET /health`
- `GET /modes`
- `POST /run`
- `POST /api/run`

Optional env:

- `FACEBOOK_COOKIES_JSON`: default `cookiesJson` used when the request body omits it
- `FACEBOOK_MARKET_API_TOKEN`: bearer or `x-api-key` auth for the HTTP API
- `PORT`: HTTP listen port, defaults to `3000`

Example health check:

```bash
curl -sS http://localhost:3000/health | jq .
```

Example live fetch with server-provided cookies:

```bash
curl -sS http://localhost:3000/run \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "fetch_live_seller_threads",
    "liveBackend": "direct_http",
    "maxPages": 2
  }' | jq .
```

Example live fetch with request-provided cookies:

```bash
curl -sS http://localhost:3000/run \
  -H 'Content-Type: application/json' \
  -d @input.json | jq .
```

## How to use Facebook Marketplace Seller Manager

1. Choose a mode.
2. Paste sample buyer threads or listing rows.
3. Optionally paste exported Facebook cookies JSON for session auditing or fallback live seller-thread fetching.
4. For the preferred live backend, configure `facebook-marketplace-pp-cli` on the runtime host with `facebook-marketplace-pp-cli auth login --chrome`.
5. Run the Actor.
6. Download JSON/CSV output or use it via API in follow-up automations.

## Input

| Field | Type | Required | Description |
|---|---|---:|---|
| `mode` | enum | yes | `conversation_inventory`, `build_reply_queue`, `build_follow_up_queue`, `send_follow_up_batch`, `listing_ops_plan`, `fetch_live_seller_threads`, `send_reply`, or `session_audit`. |
| `useSampleData` | boolean | no | Enabled by default so empty-input QA runs still produce deterministic output. |
| `threads` | array | for conversation modes | Conversation rows with `surface`, `threadUrl`, listing title, buyer name, last message, age, and status. |
| `followUpDaysThreshold` | integer | for follow-up modes | Age threshold used to select stale threads for reactivation. |
| `minDaysSinceLastMessage` | integer | optional for follow-up batch | Override threshold for `send_follow_up_batch`. Defaults to the follow-up threshold. |
| `maxMessages` | integer | optional for follow-up batch | Maximum number of stale threads returned or sent in `send_follow_up_batch`. |
| `onlyUnread` | boolean | optional for follow-up batch | Keep only stale threads that still have unread messages. |
| `includeZeroUnread` | boolean | optional for follow-up batch | Override for the batch mode when you still want zero-unread threads included. |
| `followUpUseCase` | enum | optional for follow-up modes | `generic` or `room_rental`. `room_rental` switches to rental-oriented follow-up copy. |
| `area` | string | optional for rental follow-up copy | Area or city inserted into rental follow-up text. |
| `stayWindow` | string | optional for rental follow-up copy | Stay duration wording, for example `dias o semanas`. |
| `stayRestriction` | string | optional for rental follow-up copy | Restriction wording, for example `No meses ni estancias largas`. |
| `availabilityText` | string | optional for rental follow-up copy | Availability wording used in rental follow-up text. |
| `contactPhone` | string | optional for rental follow-up copy | Phone or WhatsApp number inserted into the draft. |
| `contactChannel` | string | optional for rental follow-up copy | Contact channel label such as `WhatsApp`. |
| `listings` | array | for listing mode | Your active listing rows with title, price, age, favorites, and status. |
| `replyStyle` | enum | no | Tone for generated reply drafts. |
| `replyTemplate` | string | no | Optional custom reply pattern. |
| `cookiesJson` | string | for authenticated modes | Exported `facebook.com` cookies JSON from Cookie-Editor or equivalent. Required for `fetch_live_seller_threads`; optional for `session_audit`. |
| `liveBackend` | enum | no | `auto`, `pp_cli`, `browser_cdp`, or `direct_http`. Defaults to `auto`, which tries `facebook-marketplace-pp-cli` first. |
| `ppCliPath` | string | optional for CLI live backend | Path to `facebook-marketplace-pp-cli`. Defaults to the binary on `PATH`. |
| `ppCliConfig` | string | optional for CLI live backend | Optional config path passed as `FACEBOOK_MARKET_CONFIG`, useful for mounted runtime configs. |
| `ppCliTimeoutMs` | integer | optional for CLI live backend | Per-command timeout. Defaults to 45000 ms. |
| `maxPages` | integer | for live fetch | Maximum seller-inbox pages to fetch. Defaults to 5, capped at 40. |
| `pageSize` | integer | for live fetch | Live seller-inbox page size. Defaults to 12, capped at 12. |
| `fbDtsg` | string | optional for live fetch | Browser-extracted `fb_dtsg` token. Use it when cookies work in a real browser but Facebook home returns an error to server-side requests. |
| `browserCdpUrl` | string | optional for live fetch | Chrome DevTools Protocol endpoint, including remote browser providers such as Anchor/Browserless when you provide their endpoint. When supplied, the actor imports cookies into that browser and fetches seller threads from inside the authenticated Facebook page. |
| `browserWaitMs` | integer | optional for CDP live fetch | Wait after browser navigation before extracting Facebook runtime tokens. Defaults to 5000. |
| `threadId` | string | for `send_reply` | Marketplace seller thread id. |
| `listingId` | string | optional for `send_reply` | Listing id associated with the seller thread. |
| `message` | string | for `send_reply` | Reply text passed to `facebook-marketplace-pp-cli reply --write`. |
| `write` | boolean | optional for write-gated modes | When `false`, `send_follow_up_batch` only plans the batch. When `true`, it attempts sends programmatically. |

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

### Follow-up batch item example

```json
{
  "mode": "send_follow_up_batch",
  "resultType": "follow_up_batch_item",
  "batchIndex": 1,
  "batchStatus": "planned",
  "threadId": "thread-2",
  "surface": "marketplace_seller",
  "buyerName": "Francisco",
  "listingTitle": "Habitacion con balcon privado",
  "daysSinceLastMessage": 34,
  "unreadCount": 1,
  "recommendedAction": "send_follow_up",
  "priority": "high",
  "replyDraft": "Hola Francisco, te retomo por si todavia buscas habitacion. Ahora mismo tenemos habitaciones disponibles en Madrid para dias o semanas. No meses ni estancias largas. Si te encaja, escribeme por WhatsApp al +34642609188 y te confirmo.",
  "workflowReadiness": "follow_up_batch_planned",
  "writeAttempted": false,
  "reason": "Batch follow-up item prepared. Pass write=true to attempt sending it programmatically."
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

### Live seller-thread backend

Preferred runtime path:

```bash
facebook-marketplace-pp-cli auth login --chrome
facebook-marketplace-pp-cli doctor --agent
```

Then run:

```json
{
  "mode": "fetch_live_seller_threads",
  "liveBackend": "pp_cli",
  "maxPages": 1
}
```

The current verified read path returned real seller-thread rows from the configured browser session, including thread `930978993297322`, buyer `Clara Pazos`, listing `1 bed 1 bath Room only`, and last message `Perfecto, gracias por la info. Te confirmo en breve.`

For remote-browser runtimes, set `browserCdpUrl` to the provider endpoint. This is the right integration point for Anchor/Browserless-style browsers. Do not treat Apify cloud by itself as an authenticated Facebook session; the runtime must have either the pp-cli config or a remote CDP endpoint with the session.

### Write-gated reply mode

Example:

```json
{
  "mode": "send_reply",
  "threadId": "930978993297322",
  "listingId": "698098793060190",
  "message": "Perfecto Clara, gracias. Quedo pendiente; si quieres avanzar, me confirmas y te paso los siguientes detalles."
}
```

The actor calls `facebook-marketplace-pp-cli reply --write`. If Facebook rejects the current CLI mutation, the dataset row includes `status: "failed"`, `workflowReadiness: "reply_mutation_failed"`, `apiErrorCode`, `fbtraceId`, and the raw response so the failure is actionable.

### Batch follow-up mode

Planning example:

```json
{
  "mode": "send_follow_up_batch",
  "followUpUseCase": "room_rental",
  "area": "Madrid",
  "stayWindow": "dias o semanas",
  "stayRestriction": "No meses ni estancias largas",
  "availabilityText": "Ahora mismo tenemos habitaciones disponibles",
  "contactPhone": "+34642609188",
  "maxMessages": 10
}
```

Write-gated example:

```json
{
  "mode": "send_follow_up_batch",
  "followUpUseCase": "room_rental",
  "area": "Madrid",
  "contactPhone": "+34642609188",
  "maxMessages": 10,
  "write": true
}
```

The batch mode uses the same `send_reply` mutation path under the hood. Plan first, then enable `write=true` only when the current auth surface has already been re-proved in the same environment.

### Crawlab-compatible runtime

This repo includes [infra/crawlab/run-actor.sh](/Users/samihalawa/git/PROJECTS_MADRIDRESORTS/infra/crawlab/run-actor.sh), matching the storage pattern used by the multi-actor Crawlab repo:

```bash
infra/crawlab/run-actor.sh "$(printf '%s' '{"mode":"fetch_live_seller_threads","liveBackend":"pp_cli","maxPages":1}' | base64)"
```

The runner writes `INPUT.json`, runs `node src/main.js`, stores `OUTPUT.json`, and normalizes dataset rows into `items.jsonl` under `/data/actor-runs/facebook-marketplace-seller-manager/<task-id>/`.

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

`fetch_live_seller_threads` is the first production authenticated mode. It reads seller conversations and prepares management rows. The repo now also supports batch follow-up planning and write-gated sends, but those still depend on current live auth proof and the same Marketplace reply mutation path.

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

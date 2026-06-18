INDEX
2026-06-18 | false-positive pp_cli auth proof | browser-session proof can validate with only display cookies and still fail seller-thread auth | do inspect Chrome cookie store/config for `c_user`/`xs` and compare against live Marketplace state before trusting `doctor` | don't treat `GET /marketplace/ verified` or `Authenticated` as proof of logged-in seller-thread access | verify real Facebook cookies plus successful `inbox seller-threads`
2026-06-16 | marketplace reply writes | CLI write gate is required but current reply mutation is rejected | do use `facebook-marketplace-pp-cli reply --write` through `send_reply` and capture fbtrace | don't claim sent from dry-run, browser login, or read-thread success | verify dataset status submitted after latest write attempt
2026-06-16 | live seller manager execution | pp-cli browser-session GraphQL is the proven first path | do run `fetch_live_seller_threads` with `liveBackend: pp_cli` when the CLI session is configured, CDP only as fallback | don't regress to cookie-only direct HTTP, standalone scripts, or CDP-only architecture | verify actor output has live rows plus pp-cli/browser proof
2026-06-15 | facebook auth proof | prove live Chrome/CDP session before actor/product expansion | do recover or verify seller-thread access on the real Facebook tab first | don't let repo ranking, cookie presence, or README strength stand in for auth proof | verify current tab state, current cookies, current seller-threads
2026-06-15 | store positioning | focused seller manager with internal module split | do launch one focused Actor and keep suite modular | don't launch broad facebook manager, bundle-first, or scraper clone | verify current store saturation + Apify bundle docs

## 2026-06-18 | CURRENT

- surface/workflow: Facebook Marketplace CLI auth recovery in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: trusting `facebook-marketplace-pp-cli doctor --agent` or `auth status` as proof that Marketplace seller-thread auth is live when the stored config only contains a non-auth cookie
- superior approach: inspect `~/.config/facebook-marketplace-pp-cli/config.toml`, the Chrome `Default/Cookies` store, and the live Facebook tab together before reusing the `pp_cli` path; require real `c_user` and `xs` presence in the active Chrome profile or a successful `inbox seller-threads` read
- evidence: on 2026-06-18 the CLI still reported `Authenticated` and `GET /marketplace/ verified`, but `config.toml` only stored `access_token = '"wd=1357x703"'`; Chrome `Default/Cookies` had `262` rows and `0` `facebook.com` cookies; `auth login --chrome --profile "Work"` returned `No Chrome profile has cookies for .facebook.com`; `inbox seller-threads --agent --no-cache` still failed with `fb_dtsg not available`
- trigger terms: `Authenticated`, `browser_session_proof`, `GET /marketplace/ verified`, `wd=`, `fb_dtsg not available`, `No Chrome profile has cookies`
- do: treat this as a false-positive browser proof and reacquire a real logged-in Chrome session before spending more cycles on CLI retries
- don't: rerun `doctor`, `auth refresh`, or `seller-threads` in a loop when the stored config lacks `c_user`/`xs`
- required verification before reuse: quote the active Chrome cookie names for `.facebook.com` or a successful `seller-threads` result row, not just the doctor output

## 2026-06-16 | CURRENT

- surface/workflow: Marketplace seller reply writes in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: claiming a reply was sent from a valid browser session, successful seller-thread read, dry-run exit 0, or local/manual browser click; the user wants CLI/actor execution, not a hidden browser workaround
- superior approach: use the write-gated `facebook-marketplace-pp-cli reply --write` path through actor mode `send_reply`, capture the exact Facebook response, and only claim sent when the dataset row has `status: submitted`
- evidence: live attempts to reply to thread `930978993297322` / listing `698098793060190` reached Facebook but returned `code: 1675012`, `message: A server error noncoercible_variable_value occured`, with fbtrace ids including `GX7RmFE27Dy` and actor-run proof `G/+hFnhWTfW`
- trigger terms: `reply last conversation`, `must use the cli`, `Anchor browser`, `send_reply`, `noncoercible_variable_value`, `Marketplace seller reply`
- do: keep reply writes observable through `send_reply` and fix the CLI mutation shape before any production send-success claim
- don't: use `inbox message-seller` as a fake reply; it is a first-contact listing surface, not the seller-thread reply surface
- required verification before reuse: run `send_reply` after the mutation fix and quote `status: submitted` or the exact current `apiErrorCode`/`fbtraceId`

## 2026-06-16 | CURRENT

- surface/workflow: Facebook Marketplace Seller Manager live seller conversation fetch in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: treating exported cookies plus server-side `fb_dtsg` as enough for direct HTTP GraphQL, leaving the working extraction as a standalone CDP script outside the actor, or narrowing the actor to CDP-only after the Marketplace-specific CLI proved the same read surface
- superior approach: run the actor mode `fetch_live_seller_threads` with `liveBackend: pp_cli` when `facebook-marketplace-pp-cli auth login --chrome` has configured a valid session; use `browserCdpUrl` only as fallback for remote/Anchor/Browserless-style sessions; then normalize rows in the actor
- evidence: `facebook-marketplace-pp-cli doctor --agent` reported `auth: configured (browser session)`, `browser_session_proof: valid`, and `GET /marketplace/ verified`; `facebook-marketplace-pp-cli inbox seller-threads --agent` returned live first row `threadId: 930978993297322`, buyer `Clara Pazos`, listing `1 bed 1 bath Room only`, snippet `Perfecto, gracias por la info. Te confirmo en breve.`; earlier CDP actor proof also returned `resultCount: 24`
- trigger terms: `Seller Manager`, `prove it works`, `cookies`, `fb_dtsg`, `GraphQL`, `Marketplace seller conversations`, `Gowa`
- do: use `fetch_live_seller_threads` with `liveBackend: pp_cli` for first-path same-layer proof and only use CDP/direct HTTP as fallbacks when they actually return seller-thread data
- don't: claim Apify/cloud/server raw-cookie direct mode works from cookie presence; direct home returned HTTP `400` and direct GraphQL with token returned Facebook error `1357054`
- required verification before reuse: run the actor mode and quote output row count, `authProofLevel`, backend/browser proof markers, and at least one populated buyer/listing/thread row

## 2026-06-15 | CURRENT

- surface/workflow: Facebook Marketplace session recovery and runtime proof in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: drifting into repo comparisons, actor packaging, cookie inventory, generic browser tooling, or cookie-only "session ready" claims before proving the live Facebook session can actually expose seller threads
- superior approach: first replay the exact real-browser route that worked before on the visible Work-profile Facebook tab with Cookie-Editor import, then separate that result from the old `Chrome-CDP` debug browser before judging seller-thread access
- evidence: current run proved the recovered 7-cookie JSON imported on the live Work-profile tab shows the literal toast `Cookies were imported`, reload changes the page from `登录 Facebook` to remembered account `Zimo Qiu` with `继续`, and the next step lands on `facebook.com/two_step_verification/two_factor/...` showing `Sami Halawa Ribas · Facebook` plus `Go to your authentication app`; a separate `ps` check showed the debug endpoint at `127.0.0.1:9222` belongs to another process launched as `--user-data-dir=/Users/samihalawa/Library/Application Support/Google/Chrome-CDP`, so its failures do not prove the visible Work window failed
- trigger terms: `Zimo Qiu`, `restore session`, `older than 20 days`, `seller threads`, `reply`, `cookies were imported`, `continue as Zimo`
- do: treat the visible Work-profile Facebook tab and its post-import state as the gating proof layer before any product or automation claim; any local `session_audit` surface may only claim `cookie_artifact_only` or `needs_live_browser_verification` until that proof exists
- don't: treat the separate `Chrome-CDP` browser, raw cookie rows, remembered-account UI alone, README claims, or package installation as runtime proof
- required verification before reuse: confirm current visible Facebook tab state after Cookie-Editor import, confirm whether it stops at chooser, 2FA, or home/inbox, and only then test `seller_threads` against that same authenticated surface

## 2026-06-15 | CURRENT

- surface/workflow: Apify Store product choice for Facebook-related commercialization in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: broad `facebook-management` umbrella, bundle-first launch, or another generic Marketplace scraper competing on saturated keywords
- superior approach: one focused public Actor, `facebook-marketplace-seller-manager`, with Gowa-like internal modules split into `conversation-inventory`, `reply-queue`, `listing-ops`, and `session-audit`
- evidence: current Apify Store API shows `facebook-marketplace-scraper` at `638783` runs / `7486` users and `facebook-groups-scraper` at `3913428` runs / `30930` users; bundle docs say bundles are relatively experimental and harder to market from direct search intent
- trigger terms: `gowa`, `facebook manager`, `bundle`, `marketplace tool or general`, `separate tools`, `commercialized actor`
- do: keep the public listing narrow and commercial, then split adjacent tools into companion Actors only after traction
- don't: market the first release as full Facebook management or lead with scraping-only language
- required verification before reuse: re-check live Apify Store competition for Marketplace/Groups/Messenger terms and re-read current Apify bundle + monetization docs

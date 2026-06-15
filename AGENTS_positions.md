INDEX
2026-06-16 | live seller manager execution | browser-CDP authenticated GraphQL is the proven path | do run `fetch_live_seller_threads` with `browserCdpUrl` when raw HTTP fails | don't regress to cookie-only direct HTTP or standalone scripts | verify actor output has live rows plus browserProof
2026-06-15 | facebook auth proof | prove live Chrome/CDP session before actor/product expansion | do recover or verify seller-thread access on the real Facebook tab first | don't let repo ranking, cookie presence, or README strength stand in for auth proof | verify current tab state, current cookies, current seller-threads
2026-06-15 | store positioning | focused seller manager with internal module split | do launch one focused Actor and keep suite modular | don't launch broad facebook manager, bundle-first, or scraper clone | verify current store saturation + Apify bundle docs

## 2026-06-16 | CURRENT

- surface/workflow: Facebook Marketplace Seller Manager live seller conversation fetch in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: treating exported cookies plus server-side `fb_dtsg` as enough for direct HTTP GraphQL, or leaving the working extraction as a standalone CDP script outside the actor
- superior approach: run the actor mode `fetch_live_seller_threads` against an authenticated Chrome DevTools Protocol endpoint via `browserCdpUrl`; import the cookies into that browser, extract runtime token state inside Facebook, call the Marketplace seller GraphQL document from the page, then normalize rows in the actor
- evidence: current run of `node scripts/run-local.mjs` with `browserCdpUrl: http://127.0.0.1:9222` returned `resultCount: 24`, `resultType: live_seller_thread`, `authProofLevel: live_graphql_seller_threads`, browser proof title `(15) Facebook`, `hasMarketplace: true`, `hasZimo: true`, and first row `threadId: 930978993297322`, buyer `Clara Pazos`, listing `1 bed 1 bath Room only`
- trigger terms: `Seller Manager`, `prove it works`, `cookies`, `fb_dtsg`, `GraphQL`, `Marketplace seller conversations`, `Gowa`
- do: use `fetch_live_seller_threads` with `browserCdpUrl` for same-layer proof and only use direct HTTP as a fallback when it actually returns seller-thread data
- don't: claim Apify/cloud/server raw-cookie direct mode works from cookie presence; direct home returned HTTP `400` and direct GraphQL with token returned Facebook error `1357054`
- required verification before reuse: run the actor mode and quote output row count, `authProofLevel`, browser proof markers, and at least one populated buyer/listing/thread row

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

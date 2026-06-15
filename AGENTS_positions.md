INDEX
2026-06-15 | facebook auth proof | prove live Chrome/CDP session before actor/product expansion | do recover or verify seller-thread access on the real Facebook tab first | don't let repo ranking, cookie presence, or README strength stand in for auth proof | verify current tab state, current cookies, current seller-threads
2026-06-15 | store positioning | focused seller manager with internal module split | do launch one focused Actor and keep suite modular | don't launch broad facebook manager, bundle-first, or scraper clone | verify current store saturation + Apify bundle docs

## 2026-06-15 | CURRENT

- surface/workflow: Facebook Marketplace session recovery and runtime proof in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: drifting into repo comparisons, actor packaging, cookie inventory, or generic browser tooling before proving the live Facebook session can actually expose seller threads
- superior approach: use the active Chrome CDP surface first, inspect the real Facebook tab, verify whether auth cookies survive navigation, and only then run `facebook-marketplace-pp-cli inbox seller_threads`
- evidence: current run proved `Network.setCookies` can temporarily insert `c_user/xs/fr`, but Facebook clears them on the next navigation; four local credential pairs all return the literal login error `你输入的登录信息有误。找回你的账户并登录。`; no Chrome-family cookie DB on disk contains a live `facebook.com` auth session
- trigger terms: `Zimo Qiu`, `restore session`, `older than 20 days`, `seller threads`, `reply`, `cookies were imported`, `continue as Zimo`
- do: treat live Chrome/CDP + seller-thread visibility as the gating proof layer before any product or automation claim
- don't: treat cookie presence, remembered-account UI, README claims, or package installation as runtime proof
- required verification before reuse: confirm current Facebook tab state, confirm current cookies after a real navigation, and confirm `seller_threads` returns actual live data from the same session

## 2026-06-15 | CURRENT

- surface/workflow: Apify Store product choice for Facebook-related commercialization in `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`
- mistaken approach to avoid: broad `facebook-management` umbrella, bundle-first launch, or another generic Marketplace scraper competing on saturated keywords
- superior approach: one focused public Actor, `facebook-marketplace-seller-manager`, with Gowa-like internal modules split into `conversation-inventory`, `reply-queue`, `listing-ops`, and `session-audit`
- evidence: current Apify Store API shows `facebook-marketplace-scraper` at `638783` runs / `7486` users and `facebook-groups-scraper` at `3913428` runs / `30930` users; bundle docs say bundles are relatively experimental and harder to market from direct search intent
- trigger terms: `gowa`, `facebook manager`, `bundle`, `marketplace tool or general`, `separate tools`, `commercialized actor`
- do: keep the public listing narrow and commercial, then split adjacent tools into companion Actors only after traction
- don't: market the first release as full Facebook management or lead with scraping-only language
- required verification before reuse: re-check live Apify Store competition for Marketplace/Groups/Messenger terms and re-read current Apify bundle + monetization docs

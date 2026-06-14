# Individual Approaches - Raw And Compared

Date: 2026-06-15

## Inputs Compared

This report compares the visible attached sources and current-thread findings:

- Notion thread: "Restoring Facebook session with cookies."
- Notion/Grok output ranking `browser-use`, HARON Marketplace poster, GeorgiKeranov bot, `midscene`, and `fbchat-muqit`.
- ChatGPT project output: "Facebook Gowa Equivalent", ranking `mautrix/meta pkg/messagix` for chats, `0xzer/messagix` as standalone fallback, Apify for Marketplace reads, and browser automation for Marketplace listing writes.
- Current Codex source-falsification findings from GitHub/package searches summarized in the conversation: `printing-press-library`, `fbchat-v2`, `secondhand-mcp`, `facebook-marketplace-mcp`, `ai-marketplace-monitor`, and related fallbacks.

## Raw Compared Positions

### Notion/Grok Position

Core claim:

- Best practical tools are `browser-use`, `HARON416/Facebook-Marketplace-Auto-Poster`, `GeorgiKeranov/facebook-marketplace-bot`, `web-infra-dev/midscene`, and `fbchat-muqit` for direct cookie JSON cases.

Correct parts:

- It correctly preserved the Zimo Qiu live-session constraint.
- It correctly emphasized existing Chrome session/profile reuse.
- It correctly warned that no single clean "Gowa equivalent" exists for all personal Facebook surfaces.

Wrong or incomplete parts:

- It over-ranked generic browser automation.
- It missed `mvanhorn/printing-press-library`, which is more specific for Marketplace seller operations.
- It treated Marketplace listing/reply operations as mostly browser-profile tasks, even though a CLI/MCP surface exists.
- It did not sufficiently separate Marketplace seller inbox from personal Messenger.

### ChatGPT Position

Core claim:

- Best serious foundation for personal Messenger / Marketplace chats is `mautrix/meta pkg/messagix`.
- Closest standalone Gowa-like Go SDK is `0xzer/messagix`.
- Marketplace listing search/scrape should use Apify.
- Marketplace create/repost/edit should use browser automation.

Correct parts:

- It correctly rejected `facebook-chat-api`, old `fbchat`, `fca-unofficial`, and business-only official Meta SDKs as primary answers.
- It correctly identified `mautrix/meta/pkg/messagix` as deeper and more serious than old JS/Python browser-emulation libraries.
- It correctly separated business/Page/IG APIs from personal Facebook/Marketplace surfaces.

Wrong or incomplete parts:

- It missed `printing-press-library` for Marketplace seller create/reply/listing workflows.
- It over-stated browser automation as the only route for Marketplace create/repost/edit.
- It underweighted `fbchat-v2` as a practical Python starting point for personal Messenger with E2EE support.
- It treated `mautrix/meta` as the winner without enough cost/complexity penalty for being a Matrix bridge with internal packages.

### Claude / Prior Multi-Model Position

Core claim:

- Use `messagix` for messages, browser automation for listings, official APIs only for business, and a REST facade if building a "Facebook Gowa."

Correct parts:

- Strong separation by surface.
- Correct skepticism toward official Meta APIs for personal Marketplace.
- Correct instinct to wrap the final answer behind a local REST facade.

Wrong or incomplete parts:

- Same major miss: Marketplace seller operations are not browser-only because `printing-press-library` exists.
- It did not identify the best Marketplace-specific CLI/MCP candidate.
- It did not elevate `fbchat-v2` as the easiest current Messenger prototype path.

### Corrected Codex Position

Core claim:

- The right answer is layered by surface:
  - Marketplace seller ops: `mvanhorn/printing-press-library facebook-marketplace`.
  - Personal Messenger/E2EE: `m008v/fbchat-v2`.
  - Deep protocol fallback: `mautrix/meta/pkg/messagix`, then `0xzer/messagix`.
  - Marketplace read-only: `secondhand-mcp` or `facebook-marketplace-mcp`.
  - Browser/vision automation: fallback for gaps and visual proof.

Why this is stronger:

- It uses the most specific repo for the Marketplace seller workflow instead of a generic browser layer.
- It preserves the Gowa-like architecture goal by recommending a facade rather than coupling the user to one repo.
- It treats the live authenticated Zimo profile/cookies as the auth source of truth.
- It avoids using a business API for personal flows.

## Repository Evidence Table

| Candidate | Surface | Evidence From Current Context | Verdict |
|---|---|---|---|
| `mvanhorn/printing-press-library` `facebook-marketplace` | Marketplace seller ops: search, listing create, photo upload, inbox, replies, watches, MCP/CLI | Fresh GitHub README describes it as a write-gated Marketplace seller CLI for search, listing creation, photo upload, local watches, and replies. Commands include `auth login --chrome`, `doctor`, `inbox seller_threads`, `inbox message_seller`, `listing create`, `listing delete`, `marketplace search`, `reply`; the refreshed GitHub page showed about 1.3k stars. | Primary Marketplace automation choice. |
| `m008v/fbchat-v2` | Personal Messenger / E2EE user chat | Current-thread evidence: active 2026 repo/PyPI, Python library, E2EE bridge using Go code and `mautrix-meta`, supports send/read/listen and Facebook feature modules including Marketplace-related code. | Best practical first prototype for personal Messenger. |
| `mautrix/meta` `pkg/messagix` | Deep Meta messaging protocol layer | Fresh GitHub page describes `mautrix/meta` as a Matrix-Facebook Messenger and Instagram DM puppeting bridge and exposes `pkg/messagix` with cookies, GraphQL, DGW, Lightspeed, methods, socket, types, and related protocol folders. | Strongest deep foundation, but not the easiest standalone product. |
| `0xzer/messagix` | Standalone Go protocol reference | ChatGPT context: closest clean standalone Gowa-like library but smaller and riskier. | Useful fallback/reference, not first choice. |
| `jlsookiki/secondhand-mcp` | Read-only Marketplace/eBay/Depop/Poshmark search | Fresh GitHub README describes an MCP server for searching secondhand marketplaces, including Facebook Marketplace, and says Facebook Marketplace does not require auth for location-based search. | Good read-only search/monitor layer. |
| `jdcodes1/facebook-marketplace-mcp` | Read-only Facebook Marketplace search/monitor | Fresh GitHub README describes direct `/api/graphql/` replay using existing Facebook session cookies from Chrome, with tools for search, listing, and monitors; it explicitly says there are no write operations. | Useful for read-only MCP on macOS; not write/message layer. |
| `BoPeng/ai-marketplace-monitor` | Marketplace monitoring/search and AI notifications | Current-thread evidence: mature monitor/search, Playwright/browser-based, PyPI. | Useful monitoring product, not Gowa-like message/listing gateway. |
| `GeorgiKeranov/facebook-marketplace-bot` | Marketplace listing reposting via Selenium | Notion context: 216 stars, saves/reuses cookies after first login, CSV bulk listings. | Useful example, not best primary due fragility/GPL/Selenium. |
| `HARON416/Facebook-Marketplace-Auto-Poster` / `Auto-Reply` | Marketplace browser automation examples | Notion/current context: uses existing Chrome session, posting or auto-reply examples. | Examples only; too narrow/small as foundation. |
| `browser-use/browser-use` | General live browser automation | Notion context: high-star, persistent sessions, can attach to real profile. | Best generic fallback and UI proof tool, not primary Marketplace repo. |
| `web-infra-dev/midscene` | Vision-based browser automation | Notion context: Chrome extension, screenshot/natural-language automation, real signed-in tab. | Good for visual fallback; not the core Gowa equivalent. |
| `browserbase/stagehand` | Browser automation framework | ChatGPT/Notion context: strong browser automation option. | Fallback for UI actions, not direct Facebook gateway. |
| `fbchat-muqit` | Unofficial Messenger API | Notion context: requires Cookie-Editor JSON, but README limitation says 1:1 user-to-user sending is not supported due to E2EE. | Reject as primary. |
| `fca-unofficial`, `facebook-chat-api`, old `fbchat` | Legacy Messenger APIs | ChatGPT/current context: archived, old, unstable, browser-emulation era. | Reject as primary. |
| Official Meta SDKs / Meta MCPs | Business/Page/IG/ads APIs | All sources agree these do not cover personal Marketplace/Messenger flows. | Correct only for business surfaces. |

## Cookie / Session Comparison

The attached Notion evidence says the prior Facebook restoration proof was:

```text
login.php -> Cookie-Editor import -> "Cookies were imported" -> authenticated home feed as Zimo Qiu
```

But the visible artifact repeatedly named as a cookie file, `b92d045a02f3d62f.txt`, was described in the Notion output as Wallapop-focused:

```text
device_id, accessToken, refreshToken, OTAdditionalConsentString for .wallapop.com
```

Therefore the current evidence supports this exact statement:

- A prior successful Facebook session restore was documented in the conversation.
- The actual Facebook Cookie-Editor JSON is not present in the visible attachments.
- Do not use the Wallapop cookie file as Facebook session evidence.
- The next executable auth proof is either the live Chrome profile or a fresh `facebook.com` Cookie-Editor export containing at minimum `c_user`, `xs`, `datr`, `fr`, and `sb`.

## Kill List

Rejected as primary:

- Official Meta SDK alone: business/Page/IG scope only, not personal Marketplace.
- Pure browser automation for everything: works but misses a better Marketplace-specific CLI/MCP.
- `fbchat-muqit`: direct 1:1 limitation from E2EE.
- `facebook-chat-api` / `fca-unofficial` / old `fbchat`: old browser-emulation lineage and weaker maintenance fit.
- Random Selenium-only Marketplace repos: useful examples, fragile foundation.
- `mautrix/meta` as a full Matrix deployment if the goal is a simple Gowa-like local gateway: too heavy unless the internal `messagix` layer is intentionally wrapped.

## Final Side-By-Side Decision

| Need | Best Choice | Why |
|---|---|---|
| Marketplace seller listing create/repost/edit/delete | `printing-press-library facebook-marketplace` | Specific CLI/MCP/skill already covers write-gated seller workflows. |
| Marketplace seller inbox / replies | `printing-press-library facebook-marketplace` | Exposes seller inbox and reply-oriented commands. |
| Personal Messenger DMs | `fbchat-v2` | Practical Python path with newer E2EE bridge support. |
| Long-term protocol gateway | `mautrix/meta/pkg/messagix` | Most serious underlying Meta protocol implementation found. |
| Simple read-only Marketplace search | `secondhand-mcp` or `facebook-marketplace-mcp` | Direct MCP/search layer; no need for browser writes. |
| Visual proof / uncovered UI actions | `browser-use`, `midscene`, `stagehand` | Strong fallback for live browser state and verification. |

## Source Ledger

Searched / compared:

- Current Notion appshot and visible Notion thread text.
- Current ChatGPT appshot and visible ChatGPT thread text.
- Current conversation summaries and prior Codex findings in this thread.
- GitHub/package-search findings summarized in the current thread for all named repositories.
- Fresh GitHub/web source checks for `printing-press-library`, `fbchat-v2`, `mautrix/meta`, `messagix`, `secondhand-mcp`, and `facebook-marketplace-mcp`.

Useful:

- `mvanhorn/printing-press-library`
- `m008v/fbchat-v2`
- `mautrix/meta`
- `0xzer/messagix`
- `jlsookiki/secondhand-mcp`
- `jdcodes1/facebook-marketplace-mcp`
- `browser-use`, `midscene`, `stagehand` as fallback layers

Rejected:

- Business-only Meta SDKs as personal-flow solution.
- Old `facebook-chat-api` / `fca-*` / unmaintained `fbchat` as primary.
- `fbchat-muqit` as primary because of E2EE/direct-send limitation.
- Random Selenium/Puppeteer repos as foundation.

Missing:

- The actual Zimo Qiu `facebook.com` Cookie-Editor JSON.
- Current live Chrome visual proof of the Zimo Qiu session.
- Current installed/run proof for `printing-press-library`, `fbchat-v2`, or `messagix`.

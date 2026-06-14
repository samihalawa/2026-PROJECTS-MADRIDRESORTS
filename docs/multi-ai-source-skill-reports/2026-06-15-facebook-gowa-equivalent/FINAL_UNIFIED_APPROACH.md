# Facebook Gowa Equivalent - Final Unified Approach

Date: 2026-06-15

## Actual Objective

The real task is not just "find Facebook cookies" or "name a repo." The intended finish line is a practical, non-reinvented automation stack for a previously restored Facebook session ("Zimo Qiu") that can cover:

- Personal Messenger threads and messages.
- Facebook Marketplace seller inbox / buyer-seller threads.
- Marketplace listing search, listing detail extraction, listing creation, repost/edit/delete, replies, and monitoring.
- Cookie/profile reuse from the already authenticated Chrome session, without repeating login or relying on business-only Meta APIs.

Constraints recovered from the attached Notion and ChatGPT context:

- Generic browser automation alone is not enough if a stronger ready-made repo exists.
- Official Meta APIs are not sufficient for personal Messenger / personal Marketplace flows.
- Old `facebook-chat-api`, `fbchat`, and `fca-*` style packages are suspect unless current E2EE/session behavior is proven.
- The prior "Zimo Qiu" Cookie-Editor proof chain exists in the conversation, but the actual Facebook Cookie-Editor JSON was not present in the visible artifacts. The file repeatedly surfaced in Notion, `b92d045a02f3d62f.txt`, was described as Wallapop cookies, not Facebook cookies.
- The answer must be specific to the restored Facebook session and the actual surfaces, not a general "use Playwright" answer.

## Final Verdict

There is no single clean Facebook equivalent to Gowa for every personal Facebook surface. The correct answer is a small layered stack:

1. Primary Marketplace seller automation: `mvanhorn/printing-press-library` package `facebook-marketplace`.
2. Personal Messenger / E2EE user chat: `m008v/fbchat-v2`.
3. Deeper long-term protocol layer: `mautrix/meta` internal `pkg/messagix`, with `0xzer/messagix` as a smaller standalone reference.
4. Marketplace read-only search/monitoring: `jlsookiki/secondhand-mcp` or `jdcodes1/facebook-marketplace-mcp`.
5. Browser/vision fallback: `browser-use`, `midscene`, or `stagehand` only for gaps not covered by protocol/CLI/MCP tools.

The biggest correction to earlier AI answers: Marketplace listing creation, seller inbox, replies, and write-gated seller flows are not "browser-only" because `mvanhorn/printing-press-library/library/commerce/facebook-marketplace` already exposes a focused CLI/MCP/skill surface for those workflows.

## Build Order

1. Install the Marketplace-specific package first:

```bash
npx -y @mvanhorn/printing-press-library install facebook-marketplace
facebook-marketplace-pp-cli auth login --chrome
facebook-marketplace-pp-cli doctor
```

2. Verify read-only Marketplace access before any write:

```bash
facebook-marketplace-pp-cli marketplace search --json
facebook-marketplace-pp-cli listing get --url '<listing-url>' --json
```

3. Verify seller inbox and reply path:

```bash
facebook-marketplace-pp-cli inbox seller_threads --json
facebook-marketplace-pp-cli inbox seller_threads_page --json
```

Only after the exact seller thread is visible, test a write-gated reply:

```bash
facebook-marketplace-pp-cli reply --thread '<thread-id>' --message '<safe test message>' --write --json
```

4. For personal Messenger outside Marketplace, prototype `fbchat-v2`:

```bash
python -m pip install fbchat-v2
```

Minimum proof before use: list inbox threads, read one thread, confirm Marketplace threads if relevant, then send one safe test reply and visually verify it in Facebook.

5. If `fbchat-v2` is insufficient, prototype `mautrix/meta/pkg/messagix` as the deep Go protocol layer. Treat it as an internal package, not a polished SDK. The production shape should be a small local REST facade:

```text
fb-gowa/
  chat-gateway/
    engine: fbchat-v2 first, mautrix/meta pkg/messagix if needed
    POST /auth/import-cookies
    GET  /threads
    GET  /threads/:id/messages
    POST /threads/:id/send
    POST /threads/:id/read
  marketplace-seller/
    engine: printing-press-library facebook-marketplace
    GET  /marketplace/search
    GET  /marketplace/listing/:id
    GET  /seller/threads
    POST /seller/threads/:id/reply
    POST /listing
    PATCH /listing/:id
    DELETE /listing/:id
  marketplace-read/
    engine: secondhand-mcp or facebook-marketplace-mcp
  browser-worker/
    engine: browser-use or midscene only for uncovered UI flows
```

## Source-Specific Corrections

Notion/Grok was right that live Chrome profile/cookie reuse matters. It was too generic when it ranked `browser-use` and `midscene` above Marketplace-specific tools.

ChatGPT was right that `mautrix/meta/pkg/messagix` is a serious Meta messaging foundation and that old `fca`/`fbchat` lines are weak. It missed that Marketplace create/reply workflows have a stronger specific tool in `printing-press-library`.

Claude was right to separate personal messaging, Marketplace listing actions, and official business APIs. It was too restrictive when it treated listing create/repost/edit as browser-only.

The corrected Codex verdict is: start with `printing-press-library` for Marketplace seller workflows, use `fbchat-v2` for personal Messenger/E2EE, keep `messagix` as the lower-level fallback, and keep browser automation as a fallback instead of the default.

## Verification Standard

Do not call this working from repo stars, README claims, or package install success. The same-layer proof required is:

- Session: Facebook opens as the intended Zimo Qiu session in the chosen Chrome profile.
- Cookie/profile: exported Cookie-Editor JSON or Chrome profile proves `facebook.com` session cookies exist. The minimum relevant names are `c_user`, `xs`, `datr`, `fr`, and `sb`; do not confuse this with Wallapop cookie exports.
- Marketplace read: the tool returns live listing data for the intended location/query.
- Seller inbox: the tool returns actual seller thread IDs/titles from the Zimo session.
- Reply: the reply appears in the exact Facebook Marketplace thread after sending.
- Listing create/edit/delete: the returned listing ID/URL is visible in the Facebook UI under the same account.
- Personal Messenger: read and send proof must be visible in the exact target thread.

## Immediate Next Action

The highest-leverage next action is not another generic repo search. It is:

1. Install and run `printing-press-library facebook-marketplace` against the current Chrome profile.
2. Export or locate the actual `facebook.com` Cookie-Editor JSON from the live Zimo Qiu tab.
3. Verify `doctor`, Marketplace search, seller threads, and one safe thread read.
4. Only then test a write-gated reply or listing mutation.

## Current Proof Gaps

- The actual Zimo Qiu Facebook Cookie-Editor JSON was not present in the visible attached artifacts.
- The previous Notion evidence says the surfaced cookie export file was Wallapop-focused, not Facebook-focused.
- I have not accessed the live Chrome session in this run, so I cannot claim current Zimo Qiu login, current cookie validity, successful install, or live message/listing proof.
- This report is a source-comparison and implementation decision artifact; live execution remains blocked on access to the current authenticated browser/profile or the real exported Facebook cookie JSON.

## Red-Team Check

Likely failure points:

- Facebook GraphQL `doc_id` values rotate, so `printing-press-library` can break and require refresh.
- Cookie restore can trigger checkpoint/2FA if moved across devices or profiles.
- Marketplace seller inbox and personal Messenger are different surfaces; one working does not prove the other.
- `fbchat-v2` E2EE support is newer and may be text-first or partially wired.
- `mautrix/meta/pkg/messagix` is powerful but internal; wrapping it directly may be more work than using `fbchat-v2`.
- Browser tools are still useful for visual verification and edge flows, but should not replace stronger specific tooling where it exists.

## Decision

Use this stack:

```text
Marketplace seller ops:  mvanhorn/printing-press-library facebook-marketplace
Personal Messenger:      m008v/fbchat-v2
Deep Go fallback:        mautrix/meta pkg/messagix, then 0xzer/messagix
Marketplace read-only:   secondhand-mcp or facebook-marketplace-mcp
UI fallback/proof:       browser-use, midscene, stagehand
Rejected as primary:     official Meta APIs, legacy fca/fbchat, random Selenium-only repos
```


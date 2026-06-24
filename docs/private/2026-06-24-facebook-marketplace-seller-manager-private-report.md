# Facebook Marketplace Seller Manager Private Recovery Report

Date: 2026-06-24

## Scope

This private report consolidates the verified repo history for `/Users/samihalawa/git/PROJECTS_MADRIDRESORTS`, the current product shape, and the deploy surfaces already tied to the repo.

Primary source families used:

- 15 repo-scoped Codex session files whose structured `cwd` matched this repo.
- Current repo files: `README.md`, `.actor/*`, `src/*`, `scripts/*`, `AGENTS_positions.md`.
- Current git history for this repo from 2026-06-09 through 2026-06-24.
- Current live hosts:
  - `https://facebook-marketplace-and-autochat.megawebs.com`
  - `https://crawlab.megawebs.com`
- Related Crawlab deployment repo:
  - `/Users/samihalawa/git/PROJECTS_ON_PROCESS/2026-ALL-ACTORS-oupin-huatong-crawlab.megawebs.com`

Coverage notes:

- Claude repo-scoped project files were not present for this repo under the checked local paths.
- Many repo-scoped sessions were sidecar audits; they were counted and grouped separately from main execution threads.

## Executive Summary

The repo evolved through three real phases:

1. Live Facebook listing optimization and posting from an already authenticated browser surface.
2. Consolidation into a focused `facebook-marketplace-seller-manager` actor instead of a broad Facebook automation product.
3. Deployment of an HTTP runtime on Coolify plus a Crawlab-compatible runner path, while repeatedly correcting false auth proof and weak cookie assumptions.

The current best path is unchanged from the strongest prior sessions:

- Keep the public/product surface narrow as `facebook-marketplace-seller-manager`.
- Prefer `facebook-marketplace-pp-cli` seller-thread proof first.
- Treat direct HTTP cookies and browser CDP as fallback layers, not the primary identity of the tool.
- Keep historical exports as campaign seed data only, not as present-tense auth proof.

## Session Ledger

Verified repo-scoped Codex sessions: 15

Main execution threads:

- `2026-06-12T17-48-21-019ebc85-2019-7ba0-abe7-d7fa8fcf9afc`
- `2026-06-19T16-04-47-019ee032-d1d5-7772-8363-5e0523af892a`
- `2026-06-22T19-55-17-019ef078-ee45-76b0-a161-c4b0a1391192`
- `2026-06-24T19-15-19-019efaa1-0d50-7363-a229-a02638962b3d`

Sidecar / audit threads:

- `2026-06-12T17-49-15-019ebc85-f267-7353-ad3c-cc7b734608ce`
- `2026-06-13T00-50-13-019ebe07-5baf-74d3-a532-1c0e6df2e3dd`
- `2026-06-15T01-55-58-019ec890-444d-7f90-85dc-f4c82f278bbe`
- `2026-06-15T14-44-04-019ecb4f-7d8a-7ac1-b8f9-ea2de66dbd04`
- `2026-06-18T18-40-36-019edb9b-1cb4-7ec2-8525-744c5dff3410`
- `2026-06-19T16-06-35-019ee034-787f-7672-926d-ef194c519e50`
- `2026-06-19T16-08-42-019ee036-6739-7972-89fb-d6ddde383733`
- `2026-06-19T16-31-35-019ee04b-5c1c-7553-8b04-5a85e71b6fd7`
- `2026-06-19T17-10-43-019ee06f-2d93-7770-ad14-ee179e5e2096`
- `2026-06-24T19-17-34-019efaa3-1d3f-7503-ba9b-ca2334c5e77f`
- `2026-06-24T19-18-38-019efaa4-18b7-7e62-a4ea-ceb8e6e8ca2d`

## Timeline

### Phase 1: Listing editing and live posting surface

The 2026-06-12 main thread started on a live Facebook Marketplace edit form and then shifted into optimizing and republishing room-rental listings. The decisive user corrections in that thread were:

- stay on the already logged-in Facebook surface;
- optimize the existing listing instead of drifting into a parallel tool;
- publish a second similar room listing;
- prefer the path that had already worked before.

This phase matters because it established the durable operational rule that the authenticated Facebook surface is the truth layer, not a detached browser, not a fresh profile, and not a theory-only automation plan.

### Phase 2: Product narrowing into seller manager

By 2026-06-15, the repo had shifted from broad "Facebook Gowa equivalent" exploration into one clear product choice:

- public product: `facebook-marketplace-seller-manager`
- modular internals: conversation inventory, reply queue, follow-up queue, listing ops, session audit

The key supporting artifacts are:

- `docs/multi-ai-source-skill-reports/2026-06-15-facebook-gowa-equivalent/FINAL_UNIFIED_APPROACH.md`
- `docs/facebook-marketplace-seller-manager-launch-plan.md`
- initial repo creation commit `576f27c Create Facebook Marketplace seller manager actor`

This phase rejected a generic Facebook manager surface and locked the product onto a narrower Marketplace seller workflow.

### Phase 3: Runtime proof, auth proof, and deploy proof

From 2026-06-16 through 2026-06-19, the repo moved from design into runtime proof:

- `9b24f2c Add live Facebook seller thread fetch`
- `e02d774 Add CLI-backed Marketplace seller workflows`
- `9c8873e Handle CLI reply failures as dataset results`
- `57c8d8c Add Coolify HTTP runtime for Marketplace tool`
- `bbb0024 Fix Coolify runtime env detection`
- `d343181 Add dedicated Coolify server Dockerfile`
- `290ae6b Run Coolify server image with direct node entrypoint`
- `9ef144f Use plain Node image for Coolify runtime`
- `624ea0c Install wget in Coolify runtime image`
- `0ae626a Record Cloudflare SSL loop deployment lesson`

The repo also accumulated durable negative lessons:

- historical seller-thread exports are not current auth proof;
- `doctor` or `Authenticated` output from the CLI can be a false positive when real Facebook cookies are missing;
- remembered-account cookie shells can look promising while still failing live seller-thread auth;
- a healthy Coolify container can still be publicly broken when Cloudflare SSL mode is wrong.

### Phase 4: Programmatic follow-up expansion

The current local worktree adds a new mode:

- `send_follow_up_batch`

Local code and tests already support it, but before this recovery pass the actor schema, dataset views, and README were still documenting only the older seven-mode surface. This was a contract drift, not a product-direction change.

## Achieved State

Verified from current repo and live surfaces:

- The repo is a private GitHub-backed project: `https://github.com/samihalawa/2026-PROJECTS-MADRIDRESORTS`.
- The current public HTTP runtime is `https://facebook-marketplace-and-autochat.megawebs.com`.
- Current live `GET /health` returned JSON with `"ok": true`, `"runtime": "server"`, and `"service": "facebook-marketplace-seller-manager"`.
- The shared Crawlab control plane is live at `https://crawlab.megawebs.com` and serves the Crawlab HTML shell.
- This repo already contains `infra/crawlab/run-actor.sh` with the same storage/output pattern as the shared Crawlab monorepo, but scoped to this single actor.
- Current local `npm run check` passes.

## Current Gaps

Still not proven in the current turn:

- Current live Facebook seller-thread auth with today’s cookies.
- Current live `send_reply` success against Facebook. The repo still documents prior failure shape around the CLI mutation.
- Current Crawlab execution of this single-repo actor from `crawlab.megawebs.com`; the shared Crawlab stack exists, but this repo is not yet the repo behind that stack.
- Current live deployment of the local dirty worktree. Before this recovery pass, the live `/modes` output still reflected the older seven-mode contract and did not expose `send_follow_up_batch`.

## Related Deploy Pattern Recovered From The Crawlab Monorepo

The related repo `/Users/samihalawa/git/PROJECTS_ON_PROCESS/2026-ALL-ACTORS-oupin-huatong-crawlab.megawebs.com` provides the reusable Crawlab deployment pattern:

- Coolify app `crawlab-huatong`
- build pack: `dockercompose`
- compose file: `infra/crawlab/docker-compose.yml`
- custom image: `infra/crawlab/Dockerfile`
- shared runner: `/usr/local/bin/run-actor.sh`
- repo-root-aware build context so the same compose file works both locally and in Coolify

For this repo, the reusable part is the runner/storage contract, not the monorepo’s actor fanout.

## Recommended Closure Sequence

1. Keep this repo focused on the seller-manager actor.
2. Sync the actor/public contract to the actual local modes and fields.
3. Commit and push from this repo only.
4. Redeploy the existing seller-manager Coolify app instead of creating a new public host.
5. Verify:
   - public `/health`
   - public `/modes`
   - public `POST /run` for a safe non-auth mode
6. Treat `crawlab.megawebs.com` as a separate existing control-plane surface; only claim this actor is deployed there if the actor is actually wired into that stack and can be run from that control plane.

## Bottom Line

The work that actually survived the prior sessions is not "generic Facebook automation." It is a focused Marketplace seller manager with:

- queue-building modes,
- session-audit logic,
- live seller-thread fetch,
- write-gated reply attempts,
- a public HTTP runtime,
- and a compatible path into the existing Crawlab operating model.

The current recovery turn should preserve that narrow identity, fix the contract drift around the new batch follow-up mode, and verify deployment at the exact public/runtime layers instead of reopening broad product strategy.

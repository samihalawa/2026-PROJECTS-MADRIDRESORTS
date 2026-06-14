# Facebook Marketplace Seller Manager Launch Plan

## Current State

- Actor concept: new.
- Product type: management-first Facebook Marketplace seller workflow Actor.
- Reason for focus: the current Apify Store is crowded for Marketplace scraping and Facebook Groups scraping, but not clearly positioned around seller workflow management.
- Current repo implementation: publication-ready MVP scaffold with runnable management modes.

## Why this is the best approach

This should not launch as a broad "Facebook management" Actor.

Reasons:

1. Apify Store search intent is strongest for specific workflows, not broad platform umbrellas.
2. Actor bundles are easier to use but harder to market from SEO and are explicitly described by Apify as more experimental.
3. Facebook Groups scraping already has a dominant Apify-owned actor with very large usage.
4. Facebook Marketplace search extraction is heavily saturated.
5. Seller workflow management is a narrower, more commercial buyer problem: response speed, stale listings, negotiation consistency, and queue discipline.

## Final Product Decision

Launch one focused Actor:

- Technical name: `facebook-marketplace-seller-manager`
- Actor name: `Facebook Marketplace Seller Manager`
- SEO name: `Facebook Marketplace Seller Manager & Inbox API`

Do not launch as:

- a general Facebook bundle,
- a groups-plus-marketplace-plus-pages umbrella,
- or a pure Marketplace scraper clone.

## Gowa-like internal structure

The user instinct here is correct: the Gowa concept is flexible because it separates concerns instead of forcing one monolith.

Best internal architecture:

- one management concept,
- multiple small tools,
- one narrow public Store entry point.

Recommended internal modules:

- `session-audit`
- `conversation-inventory`
- `reply-queue`
- `listing-ops`
- later `authenticated-inbox-worker`
- later `authenticated-listing-worker`

Recommended public launch:

- one focused Actor now,
- companion Actors later if demand proves real.

This is better than a broad `facebook-management-suite` launch because Apify bundle docs explicitly note that bundles are harder to market by direct keyword intent and are more experimental.

## Commercial Positioning

Target buyers:

- individual resellers,
- car dealers,
- property brokers using Marketplace,
- high-volume local flippers,
- small agencies managing Marketplace leads.

Core promise:

- Turn Marketplace seller chaos into a structured action queue.

Primary value:

- faster replies,
- better close rate,
- clearer listing decisions,
- reduced stale inventory.

## Recommended Monetization

Use Pay per event when the live execution modes ship.

Primary event options:

- `reply-queue-item`
- `listing-op-item`
- later `managed-thread-action`
- later `managed-listing-action`

Recommended first approach:

- keep the first public release on pay-per-usage or very conservative PPE while authenticated execution is still stabilizing,
- then move to PPE once actual reply/listing actions are reliable and cost examples are known.

## Official Apify checks used

Monetization docs confirmed:

- PPE is the recommended scalable model.
- Rental is being sunset in 2026.
- Major monetization changes require a 14-day notice and are limited to once per month.

Quality score docs confirmed these categories matter:

- Reliability
- Popularity
- Feedback and community
- Ease of use
- Pricing transparency
- Trustworthiness
- History of success
- Congruency

Bundle docs confirmed:

- bundles are unified by a common use case,
- but they are more experimental and harder to market by direct keyword intent than focused Actors.

## What should be built next

Phase 1 in this repo:

- management MVP
- conversation inventory
- default non-auth run
- clean schemas
- publication-ready README

Phase 2:

- authenticated seller inbox reader
- authenticated reply executor
- authenticated listing action worker

Phase 3:

- companion public search/monitor Actor
- cross-link both Actors instead of expanding this one into a broad bundle

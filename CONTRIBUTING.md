# Contributing to NeoBrutal Commerce

Commerce is approaching v1.0. Changes should make the system safer, clearer, more portable or easier to adopt—not expand scope casually.

## Read before changing code

1. `AGENTS.md`
2. `LLMS.md`
3. `DESIGN.md`
4. `storefront/routes.json`
5. `storefront/components.json`
6. `storefront/states.json`
7. `tests/public-api-v09.json` for the release-candidate freeze

## Non-negotiable product rules

- Keep Commerce backend-independent. Provider objects stop at adapters.
- Normalized models cross the read boundary; canonical Commerce actions cross the write boundary.
- Do not hide price, renewal behavior, license capacity or totals.
- Do not fabricate reviews, guarantees, urgency, scarcity or provider outcomes.
- Normal hover never lifts a control upward. Raised controls compress toward their shadow; active press seats them.
- Preserve visible focus, keyboard access, reduced motion and forced-colors support.
- Keep light/dark styling semantic and use `clamp()` for fluid scales where practical.

## v0.9 API-freeze policy

`tests/public-api-v09.json` records the candidate public contract. Removing or renaming package exports, canonical actions/states/routes, component IDs, semantic tokens or normalized model markers is a release-blocking change unless the PR explicitly explains why the freeze must change.

Additive internals are allowed when they do not silently alter existing public meaning. Provider-specific convenience must stay behind adapter boundaries.

## Validation

Run:

```bash
npm run check
npm run test:browser
```

`npm run check` includes static, docs, release-freeze, contract, renderer, action, adapter, ownership and performance checks. Browser QA covers Chromium, mobile Chromium, Firefox and WebKit, including accessibility and canonical visual fingerprints.

A PR that changes visible production UI must include fresh visual review. A PR that intentionally changes canonical visual surfaces must update the current release baseline only after review.

## Pull-request hygiene

- Keep milestones focused; do not mix unrelated architecture work into release hardening.
- Explain customer-visible behavior and contract impact.
- Call out any API-freeze change explicitly.
- Keep generated/provider secrets, payment tokens and real license keys out of fixtures and screenshots.
- Do not weaken tests merely to make a failing implementation pass.

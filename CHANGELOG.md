# Changelog

All notable NeoBrutal Commerce changes are recorded here. v1.0 freezes the public contract that survived the v0.9 release candidate and treats future breaking changes as major-version work.

## [Unreleased]

- Post-v1 changes must preserve the public API freeze unless they are explicitly scheduled for a major release.

## [1.0.0] — Public Release

- Promoted package, runtime, TypeScript declarations, manifests and production route chrome to exact `1.0.0` / `COMMERCE v1.0` identity.
- Made `@neobrutal/commerce` publicly publishable with an explicit package file allowlist and tarball dry-run verification.
- Adopted `PolyForm-Noncommercial-1.0.0` for the public package; commercial use requires a separate written commercial license.
- Added npm trusted-publishing/OIDC release automation with provenance-ready public package metadata and no long-lived publish token in the workflow.
- Added `package-lock.json` and exact top-level QA dependency versions for release/install reproducibility.
- Froze the v1 public API in `tests/public-api-v10.json` from the reviewed `0.9.0-rc.1` contract with no intentional breaking API change.
- Preserved v0.9 visual fingerprints as historical provenance and introduced separate v1.0 canonical visual candidates for review and exact fingerprint locking.

## [0.9.0-rc.1] — Release Candidate

- Froze package exports, normalized models, canonical actions/states, route IDs, component IDs and semantic tokens against the stable v0.8 contract.
- Promoted package, runtime, TypeScript declarations, manifests and production route chrome to exact `0.9.0-rc.1` / v0.9 RC identity.
- Added connected production storefront stress from pricing/catalog through purchase recovery, account downloads/invoices and ownership management.
- Added explicit upgrade/downgrade, gift cancellation and subscription lifecycle stress while preserving activation isolation.
- Preserved the v0.8 visual lock as historical provenance and locked a separate reviewed v0.9 RC Linux baseline for home, product, checkout, account and ownership across desktop Chromium and mobile Chromium.
- Hardened tactile activation for Safari/WebKit: hover still compresses downward, while active press consumes shadow depth without moving the pointer hit target during activation.
- Added release-candidate checklist, repo contribution/security guidance and final release-note discipline.
- No planned feature architecture additions; fixes should preserve the frozen contract unless a release-blocking issue requires an explicit change.

## [0.8.0] — Docs & Adoption

- Added `AGENTS.md`, deterministic agent playbook and AI component notes.
- Added the 47-component machine-readable registry.
- Added human adoption, copy-paste recipe, theming, migration and provider-example guides.
- Added documentation conformance and v0.8 canonical visual fingerprints.

## [0.7.0] — Quality Hardening

- Added Chromium, mobile Chromium, Firefox and WebKit release coverage.
- Added strict WCAG A/AA Axe scans, keyboard, reduced-motion and forced-colors checks.
- Added responsive, resilience, CLS and static payload budgets.
- Added reviewed visual-regression fingerprints.

## [0.6.0] — Ownership Lifecycle

- Added plan-change quotes and safe upgrade/downgrade semantics.
- Added gift/transfer workflows, subscription cancel/resume, invoice history and ownership audit events.
- Added replaceable licensing-provider bridge and EDD billing lifecycle support.

## [0.5.0] — Typed Runtime & Delivery

- Added normalized TypeScript/runtime contracts and provider-neutral actions.
- Added reference and EDD adapters.
- Added headless and React renderers plus declarative/React action bindings.

## [0.4.0] — Component Completeness

- Added rich product media, reviews/trust, invoice/tax UI, payment recovery, seats/renewal and reusable system states.

## [0.3.0] — Production Storefront Architecture

- Added the ten-route storefront architecture from browse through account/license ownership.
- Added persistent cart/theme/order behavior and responsive Commerce tables.

## [0.2.0] — Workflow Foundation

- Established product detail, pricing, mini-cart, checkout, account and license workflow primitives.
- Locked tactile press-down interaction rules and browser regression coverage.

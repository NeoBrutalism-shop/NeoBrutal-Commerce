# v0.9 Release Candidate Contract

v0.9 is the freeze-and-prove milestone before NeoBrutal Commerce v1.0. It does not add a new commerce architecture layer. Its job is to prove that the system already built can be released without another rewrite.

## Release posture

The current candidate version is `0.9.0-rc.1`. Package, normalized runtime, manifests and visible storefront chrome move together so a human or agent never has to infer which contract is active.

The package remains `private` and `UNLICENSED` during RC. This prevents accidental npm publication or an unintended licensing grant while the v1.0 public/commercial packaging decision is finalized.

## API freeze

`tests/public-api-v09.json` is the v0.9 API freeze candidate, frozen from stable v0.8.0.

The freeze covers:

- package export paths
- normalized TypeScript model/interface markers
- canonical Commerce actions
- canonical state IDs
- production route IDs
- machine-readable component IDs
- semantic `--nbc-*` token names
- license plan IDs used by the reference storefront

Breaking a frozen identifier requires an explicit release-blocking reason and a documented migration. Provider-native field names are not part of the public Commerce API.

## Family compatibility

The RC keeps the NeoBrutal family interaction grammar intact:

- no upward hover lift for normal controls
- hover compresses tactile depth
- active press seats the control
- visible keyboard focus remains first class
- reduced motion preserves state meaning
- forced-colors remains legible
- light/dark use semantic tokens rather than duplicated component logic
- responsive density remains fluid and bounded

These laws remain enforced by the static and browser hardening suites carried forward from v0.7.

## Production storefront stress

`tests/commerce-v09.spec.mjs` exercises the real storefront as a connected product rather than isolated routes. It covers home, pricing, catalog, product/license selection, cart, payment failure/recovery, order completion, account downloads/invoices and license ownership. It separately verifies safe upgrade/downgrade, gift cancellation and subscription cancel/resume while activation capacity remains isolated.

The RC must retain the existing ten-route journey:

`browse → product/license → cart → checkout/recovery → order → account → license/ownership`

No known failing commerce journey is accepted.

## Visual regression

The reviewed v0.8 visual baseline remains immutable historical provenance. `tests/commerce-v08-visual.spec.mjs` runs only against the v0.8 package identity. The v0.9 RC uses a separate canonical candidate over home, product, checkout, account and ownership; after review, exact Linux CI dimensions and SHA-256 fingerprints are locked for desktop Chromium and mobile Chromium. Firefox and WebKit remain behavioral/accessibility engines rather than byte-level pixel surfaces.

## RC merge gates

Before v0.9 can merge:

1. `npm run check` passes, including the API freeze and performance budgets.
2. Browser QA passes on desktop Chromium, mobile Chromium, Firefox and WebKit.
3. Strict WCAG A/AA route scans remain clean.
4. The production storefront stress tests pass across browser projects.
5. Fresh RC visual candidates are reviewed and locked.
6. Package/runtime/types/manifests and visible route chrome agree on `0.9.0-rc.1` / v0.9 RC.
7. CHANGELOG and release notes describe every intentional freeze change.

## What is allowed in RC

- bug fixes
- accessibility fixes
- browser compatibility fixes
- documentation/release-note corrections
- performance improvements that preserve public semantics
- explicitly reviewed release-blocking API corrections

## What waits for v1.0 or later

- unrelated new commerce feature families
- provider-specific logic in core renderers/components
- architecture rewrites without a demonstrated release blocker
- public npm publication or final licensing changes before the v1.0 packaging decision

## v1.0 exit condition

v1.0 is ready when the RC freeze survives production-store stress without architecture changes, all release gates are green, public/commercial packaging is decided, and a human or coding agent can adopt Commerce from the documented contracts without hidden project knowledge.

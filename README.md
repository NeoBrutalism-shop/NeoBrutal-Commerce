# NeoBrutal Commerce

**Expressive Neo-Brutalism for digital-product, software and creator commerce.**

Commerce is a flavor of the NeoBrutalism family. It shares the same tactile interaction grammar as Soft and Rivet, but uses a louder retail material: stronger price hierarchy, boxed-product surfaces, physical press depth and conversion-oriented workflows.

> **Family law: Compress, never float.**

Ordinary interactive surfaces move **into** their depth on hover/press. They do not generically rise toward the user. Semantic lift is reserved for actions such as actually dragging an object.

## Live surfaces

**[Open the NeoBrutal Commerce flagship →](https://neobrutalism-shop.github.io/NeoBrutal-Commerce/)**

**[Browse the interactive component + block explorer →](https://neobrutalism-shop.github.io/NeoBrutal-Commerce/components.html)**

**[Open the Commerce v1.0 application lab →](https://neobrutalism-shop.github.io/NeoBrutal-Commerce/demo/v10.html)**

The public surfaces use the actual Commerce CSS, machine-readable component registry, and real production routes. They are covered by the same browser, interaction, responsive, and axe/WCAG quality gates as the shipping storefront rather than maintained as screenshot-only documentation.

## Status

`1.0.0` — public release with the Commerce API frozen through the reviewed v0.9 RC, public npm packaging, source-available noncommercial licensing, trusted-publishing release automation, and the full production quality/browser contract.

## Install

```bash
npm install @neobrutal/commerce
```

The public package is source-available under PolyForm Noncommercial 1.0.0. Commercial use requires a separate written commercial license. See `LICENSE.md` and `docs/PUBLIC-RELEASE.md`.

## Start here

### Humans

- `components.html` — full interactive 47-component + 18-block public explorer
- `demo/v10.html` — ten-route responsive application lab using the real production pages
- `docs/ADOPTION.md` — architecture and adoption checklist
- `docs/RECIPES.md` — copy-paste integration recipes
- `docs/THEMING.md` — semantic colors, tactile depth, fluid spacing/type and accessibility requirements
- `docs/PROVIDER-EXAMPLES.md` — concrete EDD and replaceable licensing bridge examples
- `docs/MIGRATION.md` — version-safe migration guidance
- `docs/EDD-MAPPING.md` — deeper EDD transaction mapping contract
- `docs/OWNERSHIP-LIFECYCLE.md` — ownership, billing and entitlement semantics
- `docs/RELEASE-CANDIDATE.md` — historical v0.9 freeze, stress and merge gates
- `docs/PUBLIC-RELEASE.md` — v1.0 public package, licensing and publish contract

### Coding agents / LLMs

Read in this order:

1. `AGENTS.md`
2. `LLMS.md`
3. `docs/AGENT-PLAYBOOK.md`
4. `storefront/routes.json`
5. `storefront/components.json`
6. `storefront/states.json`
7. `docs/AI-COMPONENT-NOTES.md` when the target component is high-risk

Do not infer Commerce meaning from provider payloads or demo copy. Normalized contracts and machine-readable manifests are authoritative.

## Production surface

- light/dark semantic tokens and fluid `clamp()` foundations
- tactile controls that compress/press instead of floating upward
- production storefront, product, pricing, cart, checkout, order, account and license routes
- product media, reviews, guarantee/trust, pricing tiers and responsive comparison tables
- persistent cart → checkout → order journey with invoice/tax/payment recovery states
- downloads, licenses, activations, seats, renewal and signed-download contracts
- canonical system/checkout/ownership/media states
- typed provider-neutral contracts, actions and action lifecycle events
- dependency-free headless renderers plus optional React/action bindings
- EDD transaction bridge and replaceable licensing-provider bridge
- ownership lifecycle: upgrade/downgrade quote/apply, gift/transfer records, subscription cancel/resume, invoice history and ownership audit timeline
- strict Axe AA, keyboard, reduced-motion, forced-colors, Chromium/Firefox/WebKit, responsive, CLS/static-payload and visual-fingerprint release gates
- machine-readable component/adoption contract for humans and agents
- v1.0 public API freeze, package tarball contract and connected production storefront stress contract

## Public documentation surfaces

- flagship landing / production storefront: `index.html`
- full registry-backed component + block explorer: `components.html`
- responsive ten-route application lab: `demo/v10.html`
- production system-state showcase retained at: `components/index.html`
- legacy `demo/v02.html` retained for regression coverage

The component explorer reads `storefront/components.json` directly, so all 47 frozen component contracts remain visible to humans and agents. The application lab frames the real production routes instead of copying them, with desktop, tablet, mobile, light, and dark inspection controls.

## Production routes

- `/` — storefront home
- `/products` — catalog
- `/product/soft` — product detail, media, reviews and license selection
- `/pricing` — plans, comparison and bundles
- `/cart` — full cart
- `/checkout` — contact, invoice/tax, payment and recovery
- `/order/success` — receipt and entitlement handoff
- `/account` — downloads, purchases, licenses and invoice history
- `/account/license/:id` — activations, seats, plan change, transfer/gift, subscription, renewal and ownership history
- `/components` — production component/state showcase used by system QA

The public `components.html` explorer sits beside these production routes and exposes every frozen component contract plus reusable composition blocks.

## Normalized runtime

```js
import '@neobrutal/commerce/styles.css';
import {composeCommerceRuntime} from '@neobrutal/commerce/contracts';
import {createActionDispatcher} from '@neobrutal/commerce/actions';

const runtime=composeCommerceRuntime({commerce,licensing});
const actions=createActionDispatcher(runtime);
```

Provider objects stop at adapters. Components and agents consume normalized models and canonical commands.

Read path:

`provider → adapter/normalizer → Commerce model → renderer → HTML / React`

Write path:

`UI / agent → Commerce action → normalized runtime → adapter → provider`

## Ownership lifecycle model

Commerce keeps transaction, ownership and billing concepts separate:

- `OrderView` — transaction
- `InvoiceView` — provider-authoritative billing/tax/refund history
- `LicenseView` — owned product scope
- `EntitlementView` — current download/update/use rights
- `SubscriptionView` — future recurring billing state
- `PlanChangeQuoteView` — consequences before a plan mutation
- `OwnershipTransferView` — gift/transfer workflow state
- `OwnershipEventView` — auditable lifecycle history

An immediate downgrade cannot silently strand active usage above target capacity. `cancel_at_period_end` preserves the already-paid term. A pending transfer invitation does not mean ownership has moved.

## Delivery packages

Core:
- `@neobrutal/commerce/styles.css`
- `@neobrutal/commerce/contracts`
- `@neobrutal/commerce/actions`
- `@neobrutal/commerce/actions/bindings`

Adapters:
- `@neobrutal/commerce/adapters/reference`
- `@neobrutal/commerce/adapters/edd`
- `@neobrutal/commerce/adapters/licensing-bridge`

Renderers:
- `@neobrutal/commerce/renderers/headless`
- `@neobrutal/commerce/renderers/react`
- `@neobrutal/commerce/renderers/action-controls`
- `@neobrutal/commerce/renderers/react-actions`
- `@neobrutal/commerce/renderers/ownership`
- `@neobrutal/commerce/renderers/react-ownership`

React is injected by the consuming application; Commerce does not bundle or pin it.

## Machine-readable contracts

- `storefront/catalog.json` — product/license/lifecycle metadata
- `storefront/routes.json` — route intent and required components/states
- `storefront/components.json` — component models, actions, states and agent rules
- `storefront/states.json` — checkout/system/ownership/operation/subscription/media taxonomy
- `tests/public-api-v09.json` — historical v0.9 RC freeze snapshot
- `tests/public-api-v10.json` — v1.0 public API freeze snapshot
- `src/contracts/` — normalized runtime + TypeScript model interfaces
- `src/actions/` — canonical commands, lifecycle events and DOM bindings
- `src/renderers/` — headless, React, action and ownership renderers

## Quality contract

```bash
npm run check
npm run test:browser
```

`npm run check` enforces static conformance, documentation/component-registry consistency, the v1.0 public API freeze and package tarball contract, contract/action/adapter regressions and payload budgets. Browser QA runs desktop Chromium, mobile Chromium, Firefox and WebKit and includes strict WCAG A/AA Axe checks, keyboard journeys, reduced-motion, forced-colors, 320–1440px responsive checks, connected production-store stress, CLS, canonical visual regression, and the permanent GitHub Pages explorer/application-lab surfaces.

No known failing commerce journey is accepted for merge.

## Hosting

The permanent GitHub Pages origin is:

`https://neobrutalism-shop.github.io/NeoBrutal-Commerce/`

Any future custom domain is an alias, not the source of truth. The repository and GitHub Pages URLs remain the durable public home so the design system stays available even if domains or hosting vendors change.

## License

`PolyForm-Noncommercial-1.0.0` for the public package. See `LICENSE.md` for the canonical terms link and required notice. Commercial use requires a separate written commercial license.

# NeoBrutal Commerce

**Expressive Neo-Brutalism for digital-product, software and creator commerce.**

Commerce is a flavor of the NeoBrutalism family. It shares the same tactile interaction grammar as Soft and Rivet, but uses a louder retail material: stronger price hierarchy, boxed-product surfaces, physical press depth and conversion-oriented workflows.

## Status

`0.7.0` — stable ownership lifecycle plus release-grade accessibility, browser, responsive, visual and performance hardening.

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
- **v0.7 hardening:** strict Axe AA checks, keyboard journeys, reduced-motion/forced-colors assertions, Chromium/Firefox/WebKit coverage, responsive matrix, CLS and static payload budgets, and committed visual-regression baselines

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
- `/components` — component/state showcase

The legacy `demo/v02.html` workflow remains regression coverage while production validation runs on the real routes.

## Normalized runtime

```js
import '@neobrutal/commerce/styles.css';
import {composeCommerceRuntime} from '@neobrutal/commerce/contracts';
import {createActionDispatcher} from '@neobrutal/commerce/actions';

const runtime=composeCommerceRuntime({commerce,licensing});
const actions=createActionDispatcher(runtime);
```

Provider objects stop at the adapters. Components and agents consume normalized models and dispatch normalized commands.

Read path:

`provider → adapter/normalizer → Commerce model → renderer → HTML / React`

Write path:

`UI / agent → Commerce action → normalized runtime → adapter → provider`

## Ownership lifecycle model

Commerce keeps transaction, ownership and billing concepts separate:

- `OrderView` proves a transaction.
- `InvoiceView` records provider-authoritative billing/tax/refund history.
- `LicenseView` describes owned product scope.
- `EntitlementView` describes current download/update rights.
- `SubscriptionView` controls future recurring billing, not current ownership.
- `PlanChangeQuoteView` exposes scope/timing/price consequences before mutation.
- `OwnershipTransferView` represents pending/accepted/cancelled/expired gift or transfer operations.
- `OwnershipEventView` provides the auditable lifecycle timeline.

An immediate downgrade cannot silently strand active usage above the target capacity. `cancel_at_period_end` means future renewal is cancelled while the paid term remains in force. A transfer invitation does not mean ownership has already moved.

See `docs/OWNERSHIP-LIFECYCLE.md` for the full contract.

## Canonical actions

Existing purchase and ownership commands remain supported, including:

- `invoice.list`
- `subscription.get`
- `subscription.cancel`
- `subscription.resume`
- `license.change.quote`
- `license.change.submit`
- `license.transfers.list`
- `license.transfer.create`
- `license.transfer.cancel`
- `license.history.list`

Optional actions are capability-gated. Components must never infer support from provider names.

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

## Provider integration

The EDD adapter accepts an injected transaction transport and maps products/variable prices, carts, checkout quotes, orders, refunds, invoice history and recurring billing into the normalized commerce boundary.

The licensing bridge accepts an injected licensing transport plus normalizers. It can expose activations, seats, renewal, signed downloads, plan changes, transfers and ownership history without changing renderer/component contracts.

See `docs/EDD-MAPPING.md` and `docs/OWNERSHIP-LIFECYCLE.md`.

## Machine-readable contracts

- `storefront/catalog.json` — product/license/lifecycle metadata
- `storefront/routes.json` — route intent and component/state coverage
- `storefront/states.json` — checkout/system/ownership/operation/subscription/media taxonomy
- `src/contracts/` — normalized runtime + TypeScript model interfaces
- `src/actions/` — canonical commands, lifecycle events and DOM bindings
- `src/renderers/` — headless, React, action and ownership renderers
- `LLMS.md` — generation/integration rules for agents

## v0.7 quality contract

`npm run check` enforces static conformance, contract/action/adapter regressions and payload budgets. Browser QA runs the production journeys in desktop Chromium, mobile Chromium, desktop Firefox and desktop WebKit/Safari-class rendering.

The v0.7 browser gate includes:

- WCAG A/AA Axe checks including color contrast on every production route
- keyboard-only purchase and ownership actions with visible focus
- reduced-motion and forced-colors execution
- viewport and touch-target checks from 320px through 1440px
- history/state resilience and delayed-hydration readability
- critical-route cumulative layout shift budget
- committed screenshot regression baselines for critical storefront and ownership surfaces

No known failing commerce journey is accepted for merge.

## License

`UNLICENSED` while the public-core/commercial packaging strategy is finalized.

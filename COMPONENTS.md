# Component Surface — v0.6

## Foundation
- tokens
- light/dark themes
- fluid `clamp()` type/spacing
- tactile depth physics
- reduced motion
- forced colors

## Storefront
- Button / action button / action link
- Product card / product action card
- Product art / badge / price block / feature list
- License selector
- Product detail / gallery / thumbnails
- Product media tabs / code / file preview
- Product metadata
- Review summary / testimonials / guarantee
- Renewal note
- Responsive data table

## Pricing
- Pricing tiers
- Featured plan treatment
- Plan comparison table
- Bundle builder / bundle totals

## Cart and checkout
- Cart item / mini-cart drawer
- Order summary
- Coupon input/status
- Checkout fields/steps
- Invoice details / tax ID
- Payment method / failure / processing / recovery
- Trust strip
- Order confirmation / receipt

## Account and ownership
Existing:
- Account navigation
- Download row
- Purchase-history row
- License card/status/key
- Activation rows
- Update eligibility
- Renewal lifecycle
- Team-seat assignment
- Entitlement note
- Active / grace / expired / cancelled / refunded states

v0.6 additions:
- Invoice history
- Plan-change quote/result
- Upgrade/downgrade timing
- Ownership transfer/gift panel
- Subscription management
- Ownership timeline / audit trail
- Ownership operation states: ready / quoted / processing / complete / failed
- Subscription states: active / cancel-at-period-end / cancelled / past-due

## Runtime/data contracts

Normalized models include v0.5 product/cart/order/license types plus:
- `InvoiceView`
- `SubscriptionView`
- `PlanChangeQuoteView`
- `OwnershipTransferView`
- `OwnershipEventView`

Capability additions:

CommerceAdapter:
- `invoiceHistory`
- `subscriptions`

LicensingAdapter:
- `planChanges`
- `transfers`
- `ownershipHistory`

Capability flags are authoritative. UI does not infer support from EDD, WordPress, NeoLicenser or any provider name.

## v0.6 actions

In addition to the existing v0.5 commands:
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

Plan change is quote-first. Pending transfer/gift does not mean ownership moved. Subscription cancellation does not silently revoke an already-paid license term.

## Renderers

Existing:
- `@neobrutal/commerce/renderers/headless`
- `@neobrutal/commerce/renderers/react`
- `@neobrutal/commerce/renderers/action-controls`
- `@neobrutal/commerce/renderers/react-actions`

v0.6:
- `@neobrutal/commerce/renderers/ownership`
  - `createPlanChangeSpec()`
  - `createTransferListSpec()`
  - `createSubscriptionSpec()`
  - `createInvoiceHistorySpec()`
  - `createOwnershipTimelineSpec()`
- `@neobrutal/commerce/renderers/react-ownership`
  - the same normalized lifecycle surfaces translated through React

## Provider adapters

- `@neobrutal/commerce/adapters/reference` — deterministic test/runtime fixture including lifecycle operations.
- `@neobrutal/commerce/adapters/edd` — injected transaction-provider bridge.
- `@neobrutal/commerce/adapters/licensing-bridge` — injected licensing-provider transport plus normalizers for licenses, entitlements, activations, seats, plan changes, transfers and ownership history.

## Production page patterns
- Storefront/home
- Product catalog/detail
- Pricing/comparison/bundles
- Full cart
- Checkout + invoice/tax + payment recovery
- Order success
- Account dashboard + invoice history
- License lifecycle workspace: activations + seats + plan change + transfer/gift + subscription + renewal + audit timeline
- Component/state showcase

## Machine-readable contracts
- `storefront/catalog.json`
- `storefront/routes.json`
- `storefront/states.json`
- `src/contracts/`
- `src/actions/`
- `docs/OWNERSHIP-LIFECYCLE.md`

## Delivery rule

HTML/static, React/shadcn, WordPress and other UI layers render normalized models and dispatch normalized Commerce actions. They must not accept raw provider objects as component contracts or call provider APIs directly when a canonical action exists.

Read path:
`provider → adapter/normalizer → normalized model → renderer`

Action path:
`UI/agent → Commerce action → normalized runtime → adapter → provider`

## Next after v0.6
- provider-specific NeoLicenser implementation on top of the licensing bridge, when that project is intentionally in scope
- transfer acceptance / recipient-side workflow
- subscription payment-method replacement and billing recovery UI
- richer jurisdictional tax outcomes
- snapshot visual baselines and WebKit coverage

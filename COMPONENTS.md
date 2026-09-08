# Component Surface — v0.8

v0.8 keeps the stable v0.7 runtime/component behavior and adds an explicit agent/adoption contract around it.

## Machine-readable component registry

`storefront/components.json` is the canonical agent-facing registry. It currently documents every primary component referenced by the ten production routes.

Each entry declares:
- `id` — stable component identifier
- `kind` — read/action/input/selection/navigation/stateful/foundation role
- `models` — normalized Commerce models the component consumes
- `actions` — canonical Commerce commands the component may dispatch
- `states` — canonical state IDs the component renders
- `agentRules` — non-obvious generation constraints

`scripts/docs-check.mjs` verifies that route components resolve in the registry and that referenced actions/states are canonical.

## Foundation
- tokens and semantic light/dark themes
- fluid `clamp()` type/spacing
- tactile depth physics: compress on hover, seat on press
- visible focus
- reduced motion
- forced colors

## Storefront and product
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
- Account navigation
- Download row
- Purchase-history row
- License card/status/key
- Activation rows
- Update eligibility
- Renewal lifecycle
- Team-seat assignment
- Entitlement note
- Invoice history
- Plan-change quote/result
- Upgrade/downgrade timing
- Ownership transfer/gift panel
- Subscription management
- Ownership timeline / audit trail

Canonical ownership states:
- `active`, `grace`, `expired`, `cancelled`, `refunded`

Canonical ownership-operation states:
- `ready`, `quoted`, `processing`, `complete`, `failed`

Canonical subscription states:
- `active`, `cancel_at_period_end`, `cancelled`, `past_due`

## Runtime/data contracts

Normalized models include:
- `ProductView`, `CartView`, `CheckoutQuoteView`, `OrderView`
- `LicenseView`, `EntitlementView`, `ActivationView`, `SeatAssignmentView`, `SignedDownloadView`
- `InvoiceView`, `SubscriptionView`, `PlanChangeQuoteView`, `OwnershipTransferView`, `OwnershipEventView`

Capability flags are authoritative. UI does not infer support from EDD, WordPress, a gateway, a licensing provider or any provider name.

## Actions

Canonical mutations/queries are exposed through `@neobrutal/commerce/actions`. Key lifecycle actions include:
- `invoice.list`
- `subscription.get`, `subscription.cancel`, `subscription.resume`
- `license.change.quote`, `license.change.submit`
- `license.transfers.list`, `license.transfer.create`, `license.transfer.cancel`
- `license.history.list`

Plan change is quote-first. Pending transfer/gift does not mean ownership moved. Subscription cancellation does not silently revoke an already-paid license term.

## Renderers

Read surfaces:
- `@neobrutal/commerce/renderers/headless`
- `@neobrutal/commerce/renderers/react`

Action surfaces:
- `@neobrutal/commerce/renderers/action-controls`
- `@neobrutal/commerce/renderers/react-actions`

Ownership lifecycle:
- `@neobrutal/commerce/renderers/ownership`
- `@neobrutal/commerce/renderers/react-ownership`

## Provider adapters

- `@neobrutal/commerce/adapters/reference` — deterministic test/reference runtime.
- `@neobrutal/commerce/adapters/edd` — injected transaction-provider bridge.
- `@neobrutal/commerce/adapters/licensing-bridge` — replaceable licensing transport + normalized lifecycle bridge.

## Production page patterns
- Storefront/home
- Product catalog/detail
- Pricing/comparison/bundles
- Full cart
- Checkout + invoice/tax + payment recovery
- Order success
- Account dashboard + invoice history
- License lifecycle workspace
- Component/state showcase

## Agent/adoption sources
- `AGENTS.md` — first-read entry point for coding agents
- `LLMS.md` — non-negotiable interaction/commerce/boundary laws
- `docs/ADOPTION.md` — human adoption guide
- `docs/AGENT-PLAYBOOK.md` — deterministic implementation workflow
- `docs/AI-COMPONENT-NOTES.md` — high-risk component generation notes
- `storefront/components.json` — machine-readable component contract
- `storefront/routes.json` — route contract
- `storefront/states.json` — state contract

## Delivery rule

HTML/static, React/shadcn, WordPress and other UI layers render normalized models and dispatch normalized Commerce actions. They must not accept raw provider objects as component contracts or call provider APIs directly when a canonical action exists.

Read path:
`provider → adapter/normalizer → normalized model → renderer`

Action path:
`UI/agent → Commerce action → normalized runtime → adapter → provider`

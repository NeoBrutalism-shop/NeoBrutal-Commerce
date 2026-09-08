# Component Surface — v0.5

## Foundation
- tokens
- light/dark themes
- fluid type and spacing
- tactile depth physics
- reduced motion
- forced colors

## Storefront
- Button
- Product card
- Product art
- Badge
- Price block
- Feature list
- License selector
- Product detail
- Product gallery + thumbnails
- Product media tabs / code / file preview
- Product metadata
- Review summary
- Testimonials
- Guarantee / trust block
- Renewal note
- Responsive data table

## Pricing
- Pricing tiers
- Featured plan treatment
- Plan comparison table
- Bundle builder
- Bundle totals

## Cart and checkout
- Cart item
- Mini-cart drawer
- Order summary
- Coupon input/status
- Checkout field
- Checkout steps
- Invoice details
- Tax / VAT input
- Payment method
- Payment failure
- Payment processing
- Payment recovery
- Trust strip
- Order confirmation / receipt

## Account and ownership
- Account navigation/tabs
- Download row
- Purchase-history row
- License card
- License status
- Masked license key
- Activation/site rows
- Update eligibility
- Renewal lifecycle
- Team-seat assignment
- Entitlement note
- Active / grace / expired / cancelled / refunded states

## System states
- Empty
- Loading / skeleton
- Error
- Offline
- Permission denied
- Unsupported feature/browser

## Production page patterns
- Storefront/home
- Product catalog
- Product detail + rich media + reviews
- Pricing/comparison/bundles
- Full cart
- Checkout + invoice/tax + payment recovery
- Order success
- Account dashboard
- License detail + activations + seats + renewal
- Component/state showcase

## v0.5 runtime/data contracts

The component system has a framework-neutral data boundary in `src/contracts/`.

Normalized view models:
- `ProductView` / `ProductOffer`
- `CartView` / `CartLineView`
- `CheckoutQuoteView`
- `OrderView`
- `LicenseView`
- `EntitlementView`
- `ActivationView`
- `SeatAssignmentView`
- `SignedDownloadView`

Adapter contracts:
- `CommerceAdapter` — products, cart, checkout, orders and customer purchase history
- `LicensingAdapter` — licenses, entitlements and optional activation/seat/renewal/download capabilities
- `composeCommerceRuntime()` — combines replaceable transaction and licensing adapters for a renderer/action layer

Runtime contract helpers:
- canonical checkout/system/ownership/media state constants
- state type guards
- adapter method/capability validation
- package export: `@neobrutal/commerce/contracts`

## v0.5 renderer contracts

Headless package export: `@neobrutal/commerce/renderers/headless`

- immutable semantic renderer specs
- safe HTML serialization
- product-card renderer
- normalized order-summary renderer
- system-state renderer
- license-card renderer
- seat-assignment renderer
- activation-list renderer

React package export: `@neobrutal/commerce/renderers/react`

- `createReactBindings(React)`
- no bundled or pinned React runtime
- same headless specs and `data-commerce-component` anatomy
- suitable for shadcn-style copy/composition without creating a second data contract

The `summary.css` primitive gives normalized cart/quote totals a reusable core surface instead of depending on demo-only `.store-*` classes.

## v0.5 action contracts

Package export: `@neobrutal/commerce/actions`

Canonical commands:
- `cart.add`
- `cart.remove`
- `checkout.quote`
- `checkout.submit`
- `order.refund`
- `license.activations.list`
- `license.seats.list`
- `seat.assign`
- `seat.remove`
- `license.renew`
- `download.create`

Action helpers:
- `createCommerceAction()` — validates and freezes an intent command
- `executeCommerceAction()` — executes one command against the normalized runtime
- `createActionDispatcher()` — adds stable action identity plus `start`, `success` and `error` lifecycle events
- optional action execution is capability-gated by adapter flags/methods

Reusable UI should dispatch these normalized commands instead of calling provider APIs directly.

## Machine-readable contracts
- `storefront/catalog.json` — products, licenses, review/guarantee/renewal metadata
- `storefront/routes.json` — route intent, primary components and supported route states
- `storefront/states.json` — checkout, system, ownership and media state taxonomy
- `src/contracts/runtime.js` — runtime adapter/state contract
- `src/contracts/index.d.ts` — TypeScript view models and interfaces
- `src/actions/runtime.js` — provider-neutral command execution
- `src/actions/index.d.ts` — typed discriminated action commands
- `src/renderers/headless.js` — renderer spec builders and HTML serializer
- `src/renderers/react.js` — React translation of renderer specs

## Renderer/action rule

HTML/static, React/shadcn, WordPress and other UI layers render normalized models and dispatch normalized Commerce actions. They must not accept raw provider objects as component contracts or call provider APIs directly when a canonical action exists.

Read path:
`provider → adapter → normalized model → renderer`

Action path:
`UI/agent → Commerce action → normalized runtime → adapter`

## Next
- bind canonical action descriptors into interactive renderer controls
- real EDD transaction adapter
- real licensing-provider adapter mapping
- upgrade/downgrade ownership flows
- gift/transfer ownership
- invoice/receipt history and richer tax outcomes
- subscription management actions
- visual regression baselines and broader cross-browser coverage

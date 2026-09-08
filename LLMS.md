# NeoBrutal Commerce — LLM Guidance

Use this file when an agent generates commerce UI or integration code with this system.

## Interaction laws
- Never move a normal control upward on hover.
- Raised controls compress toward their shadow on hover and fully seat on press.
- Selection should feel latched, not floating.
- Use motion to communicate cause, state and result.
- Drag-and-drop may lift because the object is actually being picked up.

## Commerce ethics
- Show actual price and billing/renewal period together.
- Expose renewal behavior before checkout.
- State license scope in concrete terms: sites, seats, domains, activations, support or update window.
- Discounts must show the resulting price and the discount amount.
- Cart and checkout totals remain inspectable before purchase.
- Optional extras are off by default.
- Do not create fake urgency, fake scarcity or hidden fees.
- Reviews must carry useful context and must not be fabricated by adapters or generated UI.
- Guarantees/refund promises are policy data from the commerce adapter; never invent them.

## Workflow contract
A software purchase should read as:

`product → scope/license → optional extras → cart → checkout → confirmation → account → download/license`

Do not collapse ownership and purchasing into the same mental model. Storefront surfaces may be expressive; post-purchase account/license surfaces should become calmer and operational.

## v0.5 data boundary

When generating application code, import the normalized contract from `@neobrutal/commerce/contracts` or follow the declarations in `src/contracts/index.d.ts`.

The read path is:

`provider data/event → provider adapter → normalized Commerce model → renderer spec → framework/HTML`

Never pass raw EDD, WordPress, gateway SDK, database-row or licensing-provider objects directly into Commerce components.

- Transaction data implements `CommerceAdapter`.
- Licensing/entitlement data implements `LicensingAdapter`.
- Use `createCommerceAdapter()` and `createLicensingAdapter()` to validate runtime surfaces.
- Use `composeCommerceRuntime()` when one renderer needs both boundaries.
- Capability flags decide whether optional tax/refund/invoice/activation/seat/renewal/download actions exist. Never infer capabilities from a provider or plugin name.
- `quoteCheckout()` / final order output is authoritative for money arithmetic. Do not independently reconstruct tax, discount or total calculations in the renderer.

## Normalized view models

Prefer these stable types rather than provider-shaped objects:
- `ProductView` / `ProductOffer`
- `CartView` / `CartLineView`
- `CheckoutQuoteView`
- `OrderView`
- `LicenseView`
- `EntitlementView`
- `ActivationView`
- `SeatAssignmentView`
- `SignedDownloadView`

A renderer may add local presentation state, but must not mutate the meaning of normalized commercial or ownership data.

## Action contract

Use `@neobrutal/commerce/actions` for user/application intent. The action path is:

`UI/agent intent → Commerce action → normalized runtime → provider adapter`

Canonical action names are:
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

Rules:
- Use `createCommerceAction()` instead of inventing provider-specific command names.
- Use `createActionDispatcher()` when UI needs `start`, `success` and `error` lifecycle events.
- Optional commands are capability-gated. Never expose an action merely because a provider is known to support something in general.
- Do not call adapter methods directly from reusable components when an equivalent Commerce action exists.
- Preserve action metadata such as `id`, `source` or `correlationId` for UI status and telemetry; do not use metadata to change commercial meaning.
- UI loading/error state may follow dispatcher lifecycle, but authoritative result data still comes from the normalized adapter result.

## State contract
Use `storefront/states.json` or the state constants from `@neobrutal/commerce/contracts` instead of inventing new state names.

- Checkout: `ready`, `processing`, `failed`, `recovered`.
- System: `empty`, `loading`, `error`, `offline`, `permission`, `unsupported`.
- Ownership: `active`, `grace`, `expired`, `cancelled`, `refunded`.
- Product media: `preview`, `code`, `files`.

A failure state must preserve the information needed to recover. Loading must respect reduced motion. Offline UI must not discard local cart or ownership context. Permission and unsupported states must explain the missing capability and expose a safe alternate path when one exists.

Do not invent synonyms such as `declined`, `busy`, `paused` or `disabled-license` when a canonical state already expresses the intent.

## Ownership semantics
- A purchase is not a license.
- A license is not an entitlement.
- Downloads should reflect entitlement/update eligibility.
- Expired update access should not imply the installed product stops working.
- Mask secrets/keys by default.
- Show activation/site capacity explicitly.
- Team seats and activation sites are separate capacity concepts unless an adapter explicitly maps them together.
- Cancellation of future renewal does not automatically mean loss of already licensed versions.
- Refund behavior is adapter/policy driven; UI must render the returned entitlement result rather than assume it.

## Component contracts
Prefer stable `data-commerce-component` anatomy and the shared component CSS exported by `src/index.css`.

Current production components include:
- `product-card`
- `order-summary`
- `product-media`
- `review-summary`
- `testimonials`
- `guarantee`
- `invoice-details`
- `payment-failure`
- `processing-state`
- `payment-recovery`
- `license-card`
- `seat-assignment`
- `activation-list`
- `renewal-state`
- `system-state`
- `system-states`
- `ownership-lifecycle`

Complete route/component intent lives in `storefront/routes.json`. Product/license commercial metadata lives in `storefront/catalog.json`. Runtime adapter/type intent lives in `src/contracts/`. Action intent lives in `src/actions/`.

## Renderer rule

Use `@neobrutal/commerce/renderers/headless` when generating framework-neutral or server-rendered output. Use `@neobrutal/commerce/renderers/react` when generating React delivery code.

- Headless builders produce immutable semantic renderer specs.
- `renderSpecToHtml()` is the supported HTML serializer and escapes model-provided text/attributes.
- React is injected through `createReactBindings(React)`; do not make React types or provider data part of the core contract.
- Preserve renderer-produced `data-commerce-component`, `data-state`, product/license IDs and semantic elements.
- Wire interactions to Commerce actions rather than provider callbacks.
- Do not fork separate HTML and React anatomy for the same Commerce component; both must come from the same renderer spec.

CSS, HTML, React/shadcn, WordPress templates and future renderers are all consumers of the same normalized contract. A renderer must not create a new provider-specific model layer that contradicts the core declarations.

## Backend boundary
Commerce owns presentation and customer-facing interaction. Easy Digital Downloads or another commerce adapter can own order/payment transaction state. NeoLicenser or another licensing adapter can own products, licenses, entitlements, activations, releases and signed-download authorization. Keep adapters replaceable.

See `docs/EDD-MAPPING.md` for the EDD/NeoLicenser mapping contract.

## Theme contract
Set `data-theme="light"` or `data-theme="dark"` on the document root. Prefer semantic tokens over raw theme colors.

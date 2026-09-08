# NeoBrutal Commerce — LLM Guidance

Use this file when an agent generates commerce UI with this system.

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

## State contract
Use `storefront/states.json` instead of inventing new state names.

- Checkout: `ready`, `processing`, `failed`, `recovered`.
- System: `empty`, `loading`, `error`, `offline`, `permission`, `unsupported`.
- Ownership: `active`, `grace`, `expired`, `cancelled`, `refunded`.
- Product media: `preview`, `code`, `files`.

A failure state must preserve the information needed to recover. Loading must respect reduced motion. Offline UI must not discard local cart or ownership context. Permission and unsupported states must explain the missing capability and expose a safe alternate path when one exists.

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

Current v0.4 additions include:
- `product-media`
- `review-summary`
- `testimonials`
- `guarantee`
- `invoice-details`
- `payment-failure`
- `processing-state`
- `payment-recovery`
- `seat-assignment`
- `renewal-state`
- `system-states`
- `ownership-lifecycle`

Complete route/component intent lives in `storefront/routes.json`. Product/license commercial metadata lives in `storefront/catalog.json`.

## Backend boundary
Commerce owns presentation and customer-facing interaction. Easy Digital Downloads or another commerce adapter can own order/payment transaction state. NeoLicenser or another licensing adapter can own products, licenses, entitlements, activations, releases and signed-download authorization. Keep adapters replaceable.

## Theme contract
Set `data-theme="light"` or `data-theme="dark"` on the document root. Prefer semantic tokens over raw theme colors.

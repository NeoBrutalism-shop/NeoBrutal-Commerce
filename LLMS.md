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

## Workflow contract
A software purchase should read as:

`product → scope/license → optional extras → cart → checkout → confirmation → account → download/license`

Do not collapse ownership and purchasing into the same mental model. Storefront surfaces may be expressive; post-purchase account/license surfaces should become calmer and operational.

## Ownership semantics
- A purchase is not a license.
- A license is not an entitlement.
- Downloads should reflect entitlement/update eligibility.
- Expired update access should not imply the installed product stops working.
- Mask secrets/keys by default.
- Show activation/site capacity explicitly.

## Recommended v0.2 primitives
- `.nbc-product-detail`
- `.nbc-gallery`
- `.nbc-license-selector`
- `.nbc-plan-grid`
- `.nbc-compare`
- `.nbc-bundle`
- `.nbc-mini-cart`
- `.nbc-coupon`
- `.nbc-checkout-shell`
- `.nbc-payment-method`
- `.nbc-order-success`
- `.nbc-account`
- `.nbc-download-row`
- `.nbc-license-card`
- `.nbc-update-card`

## Backend boundary
Commerce owns presentation and customer-facing interaction. Easy Digital Downloads will eventually own order/payment transaction state. NeoLicenser will own products, licenses, entitlements, activations, releases and signed-download authorization. Keep adapters replaceable.

## Theme contract
Set `data-theme="light"` or `data-theme="dark"` on the document root. Prefer semantic tokens over raw theme colors.

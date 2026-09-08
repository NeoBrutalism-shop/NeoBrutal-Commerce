# NeoBrutal Commerce — LLM Guidance

Use this file when an agent generates commerce UI with this system.

## Non-negotiable interaction rules

- Never move a normal control upward on hover.
- Raised controls compress toward their shadow on hover and fully seat on press.
- Use movement to communicate affordance or state, not decoration.
- Drag-and-drop may lift because the object is actually being picked up.

## Commerce semantics

- Always show the actual price and billing period together.
- Always expose renewal behavior before checkout.
- License/plan options must state what changes: seats, domains, activations, support or updates.
- Discounts must show the resulting price, not only a percentage.
- Cart totals must remain inspectable before purchase.
- Destructive cart actions must be reversible or clearly confirmed.

## Recommended primitives

- `.nbc-button`
- `.nbc-product-card`
- `.nbc-price`
- `.nbc-badge`
- `.nbc-license-selector`
- `.nbc-cart-item`
- `.nbc-order-summary`
- `.nbc-checkout-field`
- `.nbc-trust-strip`

## Theme contract

Set `data-theme="light"` or `data-theme="dark"` on the document root. Do not hard-code raw theme colors inside application components when a semantic token exists.

## Family compatibility

Commerce may be visually louder than Soft or Rivet, but interaction meaning must remain compatible with the NeoBrutalism family specification.

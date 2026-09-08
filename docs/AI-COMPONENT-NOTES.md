# AI Component Notes

`storefront/components.json` is the machine-readable source of truth for component → model/action/state guidance. This file explains the highest-risk generation decisions in human-readable form.

## Source precedence

When sources appear to conflict, preserve this order:

1. normalized contracts in `src/contracts/`
2. canonical actions in `src/actions/`
3. canonical states in `storefront/states.json`
4. component registry in `storefront/components.json`
5. renderer anatomy and CSS
6. demo/reference copy

Provider payload shape never outranks the normalized contract.

## Product and pricing surfaces

### `product-media`
Use only the canonical media states `preview`, `code`, and `files`. Tabs need correct semantic relationships and keyboard behavior. Do not invent downloadable files, screenshots or code samples that product data did not provide.

### `license-selector`
Selection must feel latched, not raised. Show concrete differences such as sites, seats, domains, activations, support or update windows before purchase. Do not preselect an expensive tier as a dark pattern.

### `review-summary`, `testimonials`, `guarantee`
These are content/policy surfaces. Never fabricate ratings, customer names, review counts, refund windows or guarantees.

## Cart and checkout surfaces

### `cart-item` and `order-summary`
Keep line identity, selected offer/license and price context intact. Checkout arithmetic comes from normalized quote/order data; UI code does not recalculate tax or authoritative totals from assumptions.

### `checkout`
Use semantic labels, visible error recovery and preserved order context. Price, renewal and license scope remain inspectable before submit.

### `payment-failure` / `payment-recovery`
A failed payment is not a lost cart. Keep enough context to retry or choose an alternate path. The `failed` and `recovered` states come from the canonical checkout taxonomy.

### `processing-state`
Block repeat submission while processing. Reduced-motion users must not depend on animation to understand progress.

## Account and ownership surfaces

### `license-card`
License scope is ownership; subscription is future billing; entitlement is current rights. Do not collapse these into one generic "active subscription" concept.

### `seat-assignment`
A seat is a person assignment. It is not an activation/site/domain. Keep capacity and assignment semantics separate.

### `plan-change`
Quote first. Show target plan, timing, price consequence and capacity consequence before apply. An unsafe immediate downgrade must not silently strand usage above target capacity.

### `ownership-transfer`
A pending gift/transfer invitation does not mean ownership moved. Cancellation preserves current ownership unless the adapter returns a different authoritative result.

### `subscription-management`
`cancel_at_period_end` preserves the already-paid term. `past_due` requires billing recovery; it should not silently hide owned license/entitlement information.

### `ownership-timeline`
Only render adapter-returned history. Do not synthesize a plausible past from current license/subscription state.

## System-state surfaces

### `system-states`
Use the canonical states `empty`, `loading`, `error`, `offline`, `permission`, and `unsupported`.

- empty → expose the next useful action
- loading → respect reduced motion
- error → expose recovery
- offline → preserve local state
- permission → explain capability/authorization
- unsupported → expose an alternate path when one exists

Do not replace these with stylistic synonyms that make agent and test behavior ambiguous.

## Interaction notes for generated components

- normal hover never translates upward
- press consumes shadow depth
- focus remains visible in light/dark and forced-colors modes
- motion communicates cause/state/result rather than decoration
- real navigation uses links; in-place mutation uses buttons
- status messages are live-region content only when users need asynchronous feedback
- passive status/toast surfaces must not intercept critical dialog actions

## Acceptance checklist for AI-generated UI

Before accepting generated Commerce UI, confirm:

- component IDs exist in `storefront/components.json`
- models/actions/states are normalized and canonical
- optional features are capability-gated
- provider data does not leak into component contracts
- commercial and ownership facts are not fabricated
- semantic anatomy survives without JavaScript hydration
- narrow-screen reading order remains coherent
- light/dark, keyboard, focus, reduced-motion and forced-colors behavior are intact
- the Validation loop passes

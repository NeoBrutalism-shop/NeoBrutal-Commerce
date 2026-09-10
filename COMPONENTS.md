# Component Surface — Showcase v1.1 / Commerce v1.0

NeoBrutal Commerce keeps the shipping Commerce runtime frozen at `1.0.0` while the public design-system showcase evolves independently. Showcase v1.1 makes every frozen component, reusable block, and canonical component state inspectable for humans without changing the v1.0 package/API contract.

## Live component + block explorer

`components.html` is the permanent public explorer. It renders the actual Commerce styles and frozen component registry, then layers v1.1 design guidance over those real previews.

Coverage is enforced, not aspirational:

- **47 / 47** frozen component IDs have dedicated live previews.
- **47 / 47** components have human descriptions, variants, responsive behavior, theme behavior, and accessibility expectations.
- **25 / 25** reusable Commerce blocks are documented with component composition and live-route context.
- **12 / 12** stateful component families expose interactive canonical-state inspectors.
- **42 / 42** canonical component states declared by the frozen registry have explicit live examples and consequence copy.

The explorer must not fall back to a generic “registered component” placeholder for a frozen component. `scripts/showcase-check.mjs` and Browser QA both enforce that rule.

## Machine-readable contracts

The execution contract remains frozen in `storefront/components.json`:

- `id` — stable component identifier
- `kind` — read/action/input/selection/navigation/stateful/foundation role
- `models` — normalized Commerce models the component consumes
- `actions` — canonical Commerce commands the component may dispatch
- `states` — canonical runtime state IDs the component renders
- `agentRules` — non-obvious execution/generation constraints

Showcase v1.1 adds three documentation contracts beside—not inside—the frozen npm API:

### `storefront/component-showcase.json`

One entry for each of the 47 frozen component IDs. Each entry adds:

- `category`
- base-path-safe live `route`
- human `description`
- key `variants`
- `responsiveMode`
- `themeMode`
- accessibility rule references in `a11y`

The same manifest contains reusable category, responsive, theme, and accessibility-rule taxonomies so those terms have one explicit meaning across the explorer.

### `storefront/blocks.json`

Exactly 25 reusable composition blocks. Each block declares:

- stable `id` and title
- category and description
- the frozen component IDs it composes
- live production route
- responsive and theme behavior
- accessibility expectations
- `promotedFrom` when a reusable child Block is promoted from a Page-composed compatibility parent

Blocks never create a second Commerce runtime. They are composition guidance over existing frozen components.

### `storefront/component-states.json`

Live examples for every state declared by every stateful frozen component. Each state declares:

- canonical `id`
- human title
- explicit user-facing consequence
- semantic tone (`neutral`, `info`, `warning`, `danger`, or `success`)

The state manifest must exactly match `storefront/components.json`; adding or removing a runtime state without updating the showcase fails Quality.

## Showcase taxonomies

### Responsive modes

- `wrap` — content/actions wrap inside the component without page-level horizontal overflow.
- `grid-to-stack` — multi-column content reduces columns or stacks while preserving reading order.
- `stack-controls` — controls stack on narrow screens while labels/status/consequences stay adjacent.
- `contained-scroll` — wide semantic content scrolls only inside a keyboard-reachable local container.
- `state-panel` — state message, status, and recovery/next action remain visible together.

### Theme modes

- `semantic-surface` — semantic background/surface/border/text/muted tokens in light and dark.
- `semantic-accent` — semantic accent tokens with explicit high-contrast foregrounds; meaning is not color-only.
- `semantic-status` — semantic state/status tokens plus explicit text or iconography in light and dark.

Accessibility requirements are referenced by stable rule IDs in `component-showcase.json`; their full human definitions live in that manifest and are rendered directly by `components.html`.

## Foundation

- semantic light/dark tokens
- fluid `clamp()` type and spacing
- tactile depth physics: compress on hover, seat on press
- visible keyboard focus
- reduced-motion behavior
- forced-colors behavior
- no generic upward hover lift
- no `transition: all`

## Storefront and product

- product card
- trust strip
- promo band
- badge
- price block
- product detail
- product gallery
- product media (`preview`, `code`, `files`)
- review summary
- testimonials
- guarantee
- license selector
- renewal note

## Pricing

- pricing tier
- plan comparison
- bundle builder

## Cart and checkout

- cart item
- order summary
- coupon
- checkout field
- invoice details
- checkout steps (`ready`, `processing`, `failed`, `recovered`)
- payment method
- payment failure
- payment recovery
- processing state
- order confirmation
- receipt
- download entitlement

## Account and ownership

- account navigation
- download row
- purchase-history row
- license card
- invoice history
- license status (`active`, `grace`, `expired`, `cancelled`, `refunded`)
- activation row
- update eligibility
- seat assignment
- renewal state
- plan change (`ready`, `quoted`, `processing`, `complete`, `failed`)
- ownership transfer (`ready`, `processing`, `complete`, `failed`)
- subscription management (`active`, `cancel_at_period_end`, `cancelled`, `past_due`)
- ownership timeline

## System and foundation components

- component contract
- tokens
- system states (`empty`, `loading`, `error`, `offline`, `permission`, `unsupported`)
- ownership lifecycle

## Runtime/data boundaries

Normalized models include:

- `ProductView`, `CartView`, `CheckoutQuoteView`, `OrderView`
- `LicenseView`, `EntitlementView`, `ActivationView`, `SeatAssignmentView`, `SignedDownloadView`
- `InvoiceView`, `SubscriptionView`, `PlanChangeQuoteView`, `OwnershipTransferView`, `OwnershipEventView`

Capability flags are authoritative. UI does not infer support from EDD, WordPress, a gateway, a licensing provider, or any provider name.

Canonical mutations and queries are exposed through `@neobrutal/commerce/actions`. Plan change remains quote-first. A pending transfer invitation does not mean ownership moved. `cancel_at_period_end` preserves the already-paid term. Provider-specific objects stop at the adapter boundary.

Read path:

`provider → adapter/normalizer → normalized model → renderer`

Action path:

`UI/agent → Commerce action → normalized runtime → adapter → provider`

## Reusable block catalog

The 25 v1.1 blocks are:

1. `storefront-hero`
2. `product-grid`
3. `trust-band`
4. `trust-strip`
5. `testimonials`
6. `guarantee`
7. `product-media`
8. `product-detail`
9. `product-gallery`
10. `license-purchase`
11. `pricing-trio`
12. `plan-comparison`
13. `bundle-builder`
14. `cart-summary`
15. `checkout-shell`
16. `payment-recovery`
17. `order-success`
18. `order-confirmation`
19. `account-dashboard`
20. `license-dashboard`
21. `seat-management`
22. `ownership-operations`
23. `subscription-management`
24. `ownership-timeline`
25. `system-states`

Their authoritative metadata is `storefront/blocks.json`; the public explorer renders every block preview and links to the real production route where the pattern is exercised. Page-composed compatibility Blocks remain available while promoted child Blocks gain reusable identities, so v1.1 documentation expansion does not force v1.2 Page migration.

## Verification

`npm run check` includes `scripts/showcase-check.mjs`, which validates exact component/preview/docs/block/state coverage and contract references. Browser QA then exercises the live explorer across Chromium desktop, mobile Chromium, Firefox, and WebKit with Axe A/AA, interaction, state switching, theme, search/filter, horizontal-overflow, and screenshot review coverage.

The frozen Commerce v1.0 package/API/visual-release checks continue to run alongside these v1.1 showcase checks.

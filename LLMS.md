# NeoBrutal Commerce — LLM Guidance v1.4

Use this file for non-negotiable generation and integration rules. Coding agents should begin with `AGENTS.md`, then use `storefront/agents.json` as the machine-readable execution contract and this file as the ethics, interaction, and provider-boundary law layer.

## Agent execution order

The composition hierarchy is `Components → Blocks → Pages → Applications`.

Before writing UI or integration code:

1. read `storefront/agents.json` and follow its exact workflow/output contract;
2. locate the target route in `storefront/routes.json`;
3. resolve route component contracts in `storefront/components.json`;
4. inspect the route-keyed Page in `storefront/pages.json` and each referenced Block in `storefront/blocks.json`;
5. read canonical runtime semantics in `storefront/states.json`;
6. confirm normalized models/capabilities in `src/contracts/index.d.ts`;
7. confirm canonical commands in `src/actions/runtime.js`;
8. resolve interaction behavior in `storefront/interactions.json`;
9. follow `docs/AGENT-PLAYBOOK.md` and component-specific notes in `docs/AI-COMPONENT-NOTES.md`.

If a requested capability is absent, do not guess a provider-shaped contract. Extend the normalized boundary deliberately or leave the unsupported control out.

## Authority by concern

Do not use one global precedence list for questions owned by different layers. Resolve conflicts according to the concern being answered:

- route intent, required primary components, and route-level state sets → `storefront/routes.json`;
- Page metadata and Page → Block composition → `storefront/pages.json`;
- reusable Block → Component composition → `storefront/blocks.json`;
- component models/actions/states/kind/agent rules → `storefront/components.json`;
- canonical runtime state meaning and recovery obligations → `storefront/states.json`;
- tactile physics, interaction patterns, token roles, reduced motion, forced colors, and explicit exceptions → `storefront/interactions.json`;
- normalized models and capability boundaries → `src/contracts/`;
- canonical mutations and dispatch semantics → `src/actions/`;
- renderer anatomy / CSS → implementation of already-resolved normalized meaning;
- demo/reference copy → examples only, never a source of Commerce semantics.

Provider payload shape never outranks the normalized contract. Pages do not duplicate route states, and no source may create a second interaction taxonomy beside `storefront/interactions.json`.

## Interaction laws

- Never move a normal control upward on hover.
- Raised controls compress toward their shadow on hover and fully seat on press.
- Selection should feel latched, not floating.
- Use motion to communicate cause, state and result.
- Motion never carries meaning by itself; text and programmatic state remain authoritative.
- Drag-and-drop may lift because the object is actually being picked up.
- Preserve visible focus, reduced-motion behavior and forced-colors legibility.

## Commerce ethics

- Show actual price and billing/renewal period together.
- Expose renewal behavior before checkout.
- State license scope concretely: sites, seats, domains, activations, support or update window.
- Discounts must show resulting price and discount amount.
- Cart and checkout totals remain inspectable before purchase.
- Optional extras are off by default.
- Do not create fake urgency, scarcity or hidden fees.
- Reviews, testimonials and guarantees are adapter/content/policy data; never fabricate them.

## Boundary rule

Never pass raw EDD, WordPress, gateway, database-row or licensing-provider objects into Commerce components.

Read path:
`provider → adapter/normalizer → normalized Commerce model → renderer → HTML / React`

Write path:
`UI / agent → Commerce action → normalized runtime → adapter → provider`

- Transaction data implements `CommerceAdapter`.
- Licensing data implements `LicensingAdapter`.
- Use runtime capability flags instead of provider-name assumptions.
- Provider quote/order/invoice output is authoritative for commercial arithmetic.
- A renderer may add presentation state but must not change commercial or ownership meaning.

## Normalized models

Use `src/contracts/index.d.ts` / `@neobrutal/commerce/contracts`.

Core models include:
- `ProductView`, `CartView`, `CheckoutQuoteView`, `OrderView`
- `LicenseView`, `EntitlementView`, `ActivationView`, `SeatAssignmentView`
- `SignedDownloadView`
- `InvoiceView`, `SubscriptionView`, `PlanChangeQuoteView`, `OwnershipTransferView`, `OwnershipEventView`

Keep these concepts separate:
- order = transaction
- invoice/receipt = billing record
- license = owned scope
- entitlement = current download/update/use rights
- subscription = future recurring billing state
- seat = person assignment
- activation = site/domain/device scope
- transfer/gift = ownership movement workflow
- ownership event = auditable provider-returned history

## Ownership lifecycle semantics

- Quote plan changes before applying them.
- Never apply an immediate downgrade that would silently strand current usage above target capacity.
- A next-term downgrade can preserve the paid term until renewal.
- `cancel_at_period_end` is not immediate license revocation.
- A transfer/gift invitation with status `pending` does not mean ownership has moved.
- Refund effects on entitlements are provider/policy driven; render the returned result instead of assuming revocation.
- Ownership history comes from the adapter; do not fabricate missing historical events from current state.

See `docs/OWNERSHIP-LIFECYCLE.md`.

## Canonical actions

Use `@neobrutal/commerce/actions` and `createActionDispatcher()` instead of provider callbacks.

Purchase/core:
- `cart.add`, `cart.remove`
- `checkout.quote`, `checkout.submit`
- `order.refund`
- `download.create`

License/entitlement:
- `license.activations.list`
- `license.seats.list`
- `seat.assign`, `seat.remove`
- `license.renew`

Billing/ownership:
- `invoice.list`
- `subscription.get`, `subscription.cancel`, `subscription.resume`
- `license.change.quote`, `license.change.submit`
- `license.transfers.list`, `license.transfer.create`, `license.transfer.cancel`
- `license.history.list`

Action rules:
- Use canonical command names; do not invent provider-specific verbs.
- Optional commands are capability-gated.
- Preserve action metadata such as `id`, `source` and `correlationId` for status/telemetry only.
- Loading/error UI may follow dispatcher lifecycle, but authoritative results come from adapters.
- Static controls may use `@neobrutal/commerce/actions/bindings`; React controls may use `@neobrutal/commerce/renderers/react-actions`.

## State contract

Use `storefront/states.json` / runtime constants. Do not invent synonyms when a canonical state exists.

- Checkout: `ready`, `processing`, `failed`, `recovered`.
- System: `empty`, `loading`, `error`, `offline`, `permission`, `unsupported`.
- Ownership: `active`, `grace`, `expired`, `cancelled`, `refunded`.
- Ownership operation: `ready`, `quoted`, `processing`, `complete`, `failed`.
- Subscription: `active`, `cancel_at_period_end`, `cancelled`, `past_due`.
- Media: `preview`, `code`, `files`.

A failure must preserve enough context to recover. `past_due` must expose billing recovery rather than silently hiding ownership. Loading must respect reduced motion.

## Component registry

`storefront/components.json` is the machine-readable component contract for agents. Every production route primary component must resolve there. Read each component's `models`, `actions`, `states`, `kind` and `agentRules` before generating it.

For production route work, also resolve the route's `storefront/pages.json` Page and the referenced `storefront/blocks.json` compositions. Component contracts own component meaning; Blocks and Pages only compose that meaning into larger reusable/application structures.

Preserve stable `data-commerce-component`, `data-state`, IDs and semantic elements. The registry documents meaning; the renderer/component implementation owns concrete anatomy.

## Interaction contract

`storefront/interactions.json` is the v1.3 machine-readable interaction authority. Use its production patterns, token roles, reduced-motion behavior, forced-colors behavior, and explicit exceptions instead of inventing local motion rules. Runtime state and action meaning still come from their own authorities.

## Renderer rule

Use:
- `@neobrutal/commerce/renderers/headless` for framework-neutral read surfaces.
- `@neobrutal/commerce/renderers/react` for React read surfaces.
- `@neobrutal/commerce/renderers/action-controls` / `react-actions` for canonical commands.
- `@neobrutal/commerce/renderers/ownership` / `react-ownership` for lifecycle surfaces.

Do not fork a provider-shaped React model separate from the headless model.

## Provider adapters

### EDD
Use `@neobrutal/commerce/adapters/edd` for transaction-provider normalization. The host supplies transport/auth/session behavior. Unknown gateway states must be mapped deliberately or rejected.

### Licensing bridge
Use `@neobrutal/commerce/adapters/licensing-bridge` for a replaceable licensing provider. The host supplies transport methods and normalizers. Capabilities determine whether activation, seat, renewal, download, plan-change, transfer and history methods exist.

Do not change Commerce component contracts to match a specific licensing provider.

## Theme contract

Set `data-theme="light"` or `data-theme="dark"` on the document root. Prefer semantic tokens over raw theme colors. Theme changes must not alter commercial/ownership meaning or tactile physics.

## Agent review output

Before completion, produce the exact review fields required by `storefront/agents.json`: routes affected, Page contracts, Block contracts, component contracts, normalized models, canonical actions/states, capability gates, interaction patterns, accessibility, responsive behavior, and tests changed.

## Validation

Run both gates before completion:

```bash
npm run check
npm run test:browser
```

Do not make failures disappear by disabling Axe rules, dropping browser projects, weakening visual fingerprints or bypassing the normalized contract.

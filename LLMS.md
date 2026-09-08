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
- Discounts must show resulting price and discount amount.
- Cart and checkout totals remain inspectable before purchase.
- Optional extras are off by default.
- Do not create fake urgency, scarcity or hidden fees.
- Reviews and guarantees are adapter/policy data; never fabricate them.

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
- A renderer may add presentation state but must not change commercial/ownership meaning.

## Normalized models

Use the declarations in `src/contracts/index.d.ts` / `@neobrutal/commerce/contracts`.

Core models include:
- `ProductView`, `CartView`, `CheckoutQuoteView`, `OrderView`
- `LicenseView`, `EntitlementView`, `ActivationView`, `SeatAssignmentView`
- `SignedDownloadView`

v0.6 adds:
- `InvoiceView`
- `SubscriptionView`
- `PlanChangeQuoteView`
- `OwnershipTransferView`
- `OwnershipEventView`

## Ownership lifecycle semantics

Keep these concepts separate:
- Order = transaction.
- Invoice/receipt = billing record.
- License = owned scope.
- Entitlement = current download/update/use rights.
- Subscription = future recurring billing state.
- Seat = person assignment.
- Activation = site/domain/device scope.
- Transfer/gift = ownership movement workflow.
- Ownership event = auditable provider-returned history.

Rules:
- Quote plan changes before applying them.
- Never apply an immediate downgrade that would silently strand current usage above the target capacity.
- A next-term downgrade can preserve the paid term until renewal.
- `cancel_at_period_end` is not immediate license revocation.
- A transfer/gift invitation with status `pending` does not mean ownership has moved.
- Refund effects on entitlements are provider/policy driven; render the returned result instead of assuming revocation.
- Ownership history comes from the adapter; do not fabricate missing historical events from current state.

See `docs/OWNERSHIP-LIFECYCLE.md`.

## Canonical actions

Use `@neobrutal/commerce/actions` and `createActionDispatcher()` instead of provider callbacks.

v0.5 commands remain valid:
`cart.add`, `cart.remove`, `checkout.quote`, `checkout.submit`, `order.refund`, `license.activations.list`, `license.seats.list`, `seat.assign`, `seat.remove`, `license.renew`, `download.create`.

v0.6 adds:
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

## Renderer rule

Use:
- `@neobrutal/commerce/renderers/headless` for framework-neutral read surfaces.
- `@neobrutal/commerce/renderers/react` for React read surfaces.
- `@neobrutal/commerce/renderers/action-controls` / `react-actions` for canonical commands.
- `@neobrutal/commerce/renderers/ownership` / `react-ownership` for v0.6 lifecycle surfaces.

Preserve renderer-produced `data-commerce-component`, `data-state`, IDs and semantic elements. Do not fork a provider-shaped React model separate from the headless model.

## Provider adapters

### EDD
Use `@neobrutal/commerce/adapters/edd` for transaction-provider normalization. The host supplies transport/auth/session behavior. Unknown gateway states must be mapped deliberately or rejected.

### Licensing bridge
Use `@neobrutal/commerce/adapters/licensing-bridge` for a replaceable licensing provider. The host supplies transport methods and normalizers. Capabilities determine whether activation/seat/renewal/download/plan-change/transfer/history methods exist.

Do not change Commerce component contracts to match a specific licensing provider.

## Component anatomy

Prefer stable `data-commerce-component` anatomy exported by the core CSS. v0.6 ownership components include:
- `invoice-history`
- `plan-change`
- `ownership-transfer`
- `subscription-management`
- `ownership-timeline`

Existing product, cart, checkout, license, seat, activation, renewal and system-state components remain supported.

## Theme contract
Set `data-theme="light"` or `data-theme="dark"` on the document root. Prefer semantic tokens over raw theme colors.

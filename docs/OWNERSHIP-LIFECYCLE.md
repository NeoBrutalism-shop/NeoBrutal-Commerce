# NeoBrutal Commerce — Ownership Lifecycle v0.6

v0.6 extends Commerce from purchase/renewal presentation into a normalized ownership-management contract. The UI still does not own provider policy: transaction and licensing adapters return the authoritative result, while Commerce makes the consequence visible and actionable.

## Core separation

Keep these concepts distinct:

- **Order** — a transaction record.
- **Invoice / receipt** — a billing record for an order.
- **License** — product/use scope owned by an account.
- **Entitlement** — what may currently be downloaded, updated or used.
- **Subscription** — future recurring billing/renewal state.
- **Seat** — a person assignment inside a license.
- **Activation** — a site/domain/device scope using a license.
- **Transfer / gift** — a pending or completed ownership movement.
- **Ownership event** — an auditable provider-returned lifecycle event.

A change to one concept must not silently mutate another unless the provider explicitly returns that policy.

## Plan changes

Plan changes use two operations:

1. `quotePlanChange()` / `license.change.quote`
2. `changePlan()` / `license.change.submit`

The quote exposes:
- source and target offers
- upgrade / downgrade / lateral direction
- immediate vs next-term timing
- price adjustment
- next-term amount when available
- warnings or blocking consequences

An immediate downgrade must not silently strand active sites, activations or seats outside the target capacity. Adapters should reject unsafe immediate changes or return a quote that explains the required cleanup. A next-term downgrade may be scheduled while current paid capacity remains valid.

## Transfer and gift

`createTransfer()` does not mean ownership has already moved. The normalized `OwnershipTransferView.status` is explicit:

- `pending`
- `accepted`
- `cancelled`
- `expired`

Gift and transfer are different intents but share the same lifecycle record. The current owner may cancel a pending invitation when the provider supports it. Recipient acceptance remains provider workflow and must not be faked by the renderer.

## Subscription management

Subscription state is not license state.

Canonical subscription states:
- `active`
- `cancel_at_period_end`
- `cancelled`
- `past_due`

`cancel_at_period_end` means future renewal is disabled while the already-paid term remains in force. UI must not describe it as an immediate license revocation. `past_due` must expose recovery rather than silently removing access.

## Invoice history

Invoice history is a CommerceAdapter capability (`invoiceHistory`) and returns normalized `InvoiceView` records. Provider totals, taxes, refund status and downloadable invoice URLs are authoritative. Renderers do not rebuild tax or refund math.

## Ownership timeline

`listOwnershipEvents()` returns the auditable timeline. Events should describe material changes such as:
- purchase / issuance
- activation changes
- seat assignment/removal
- renewal
- plan change / scheduled plan change
- transfer/gift creation or cancellation
- provider-confirmed transfer acceptance

Renderers display the event summary and metadata; they do not infer missing historical events from current state.

## Capability gates

Commerce capabilities:
- `invoiceHistory`
- `subscriptions`

Licensing capabilities:
- `planChanges`
- `transfers`
- `ownershipHistory`

These are additive to v0.5 capabilities. If a capability is `true`, the runtime validates that its required methods exist.

## Canonical actions

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

Reusable UI and agents dispatch these commands rather than calling provider APIs directly.

## Provider bridge

Use `@neobrutal/commerce/adapters/licensing-bridge` to connect a licensing provider without changing Commerce models. The host injects a provider transport and normalizer functions; the bridge exposes a validated `LicensingAdapter`.

The boundary remains:

`provider → bridge/normalizer → LicensingAdapter → normalized model → renderer`

and for writes:

`UI / agent → Commerce action → normalized runtime → LicensingAdapter → provider`

## UI rule

Ownership UI should be calmer than acquisition UI. Consequences must be visible before a destructive or scope-changing action. Never use fake urgency, silent downgrades, hidden cancellation effects or provider-specific jargon as a substitute for normalized state.

# EDD Mapping Contract — Draft v0.5

This document defines how an Easy Digital Downloads integration maps into the NeoBrutal Commerce v0.5 typed adapter boundary. It is an implementation contract for adapter authors, not a requirement that Commerce depend on EDD.

Commerce remains framework/backend independent. EDD is one possible transaction provider; NeoLicenser is one possible licensing provider. Components consume normalized Commerce view models only.

## Responsibility split

### NeoBrutal Commerce
Owns customer-facing presentation, interaction and normalized component contracts:
- product detail and catalog presentation
- pricing/license choice
- cart and checkout surfaces
- invoice/tax/payment state presentation
- confirmation/account/download presentation
- shared state and ownership semantics

### CommerceAdapter / EDD implementation
Owns transaction-provider translation:
- products and variable prices
- cart/order state
- authoritative subtotal/discount/tax/total calculations
- payment state
- discounts
- invoices/receipts
- refunds
- customer purchase records

Raw EDD objects stop at this adapter boundary.

### LicensingAdapter / NeoLicenser implementation
Owns software ownership translation:
- product/variant identity mapping
- license records
- entitlements
- activations/domains
- seats
- releases/update eligibility
- signed download authorization
- renewal state

Raw licensing database rows or provider SDK objects stop at this adapter boundary.

## Runtime imports

```js
import {
  createCommerceAdapter,
  createLicensingAdapter,
  composeCommerceRuntime
} from '@neobrutal/commerce/contracts';
```

Adapter implementations are validated at runtime and strongly typed for TypeScript consumers.

## EDD → CommerceAdapter mapping

| EDD/provider concept | Commerce v0.5 model / method | Rule |
| --- | --- | --- |
| Download/product | `ProductView` via `listProducts()` / `getProduct()` | Normalize provider IDs, copy and offers before rendering. |
| Variable price option | `ProductOffer` | Map price option to stable offer/license ID and concrete capacity metadata. |
| Cart | `CartView` via `getCart()` | Return normalized lines plus authoritative money totals. |
| Add/remove cart item | `addCartLine()` / `removeCartLine()` | Provider owns mutation; renderer receives the resulting normalized cart. |
| Coupon/discount | `DiscountLineView[]` | UI renders returned discount values; it does not recalculate them. |
| Tax/VAT | `TaxLineView[]` from `quoteCheckout()` | EDD/tax provider remains authoritative for jurisdiction, rounding and validation. |
| Checkout estimate | `CheckoutQuoteView` | Must expose final customer-visible subtotal, discounts, taxes and total together. |
| Gateway/payment outcome | `CheckoutState` | Map only to `ready`, `processing`, `failed` or `recovered`; preserve order context through recovery. |
| Completed order | `OrderView` via `submitOrder()` / `getOrder()` | Do not issue UI ownership assumptions from payment state alone. |
| Customer orders | `listCustomerOrders()` | Normalize history independently from license/entitlement state. |
| Receipt/invoice | `OrderView.receiptUrl` and normalized metadata | Provider-specific receipt implementation stays behind the adapter. |
| Refund request/result | optional `requestRefund()` + normalized `OrderView` | Licensing effects are resolved separately through the licensing boundary. |

## NeoLicenser → LicensingAdapter mapping

| NeoLicenser/provider concept | Commerce v0.5 model / method | Rule |
| --- | --- | --- |
| License | `LicenseView` via `listLicenses()` / `getLicense()` | Mask secrets before they reach normal rendering surfaces. |
| Entitlement | `EntitlementView` via `listEntitlements()` | Purchase history is not sufficient evidence of current download/update eligibility. |
| Activation/domain/device | `ActivationView` via optional `listActivations()` | Keep activation capacity separate from team-seat capacity unless provider policy explicitly joins them. |
| Team member/seat | `SeatAssignmentView` via optional seat methods | Assignment records are ownership operations, not payment-provider records. |
| Update term/renewal | `LicenseView` via optional `renewUpdates()` | Expired update access does not automatically invalidate versions already licensed under purchased terms. |
| Signed download | `SignedDownloadView` via optional `createSignedDownload()` | Components never construct protected download URLs themselves. |

## Capability contract

An adapter advertises optional features explicitly.

Commerce capabilities:
- `taxes`
- `discounts`
- `invoices`
- `refunds`

Licensing capabilities:
- `activations`
- `seats`
- `renewals`
- `signedDownloads`

When a licensing capability is `true`, the v0.5 runtime requires the corresponding methods to exist. A renderer can therefore decide whether to expose an action without guessing from provider identity.

## Required integration rule

Never let templates or React components query EDD, WordPress, payment-gateway or licensing tables directly.

The integration path is:

`provider data/event → provider adapter → normalized Commerce model → renderer/component`

For a completed software purchase, a typical orchestration flow is:

`EDD order complete → resolve product/offer mapping → NeoLicenser issues license + entitlements → CommerceAdapter returns OrderView → LicensingAdapter returns LicenseView/EntitlementView → account UI renders normalized ownership`

The orchestration may be synchronous or event-driven, but the UI contract remains the same.

## Money and tax rule

Commerce UI never rebuilds provider totals from individual prices. `quoteCheckout()` and the final order response are authoritative for money calculations, including rounding, discounts, tax and final total.

The UI may format a normalized `Money` value when `formatted` is absent, but it must not alter the numerical result returned by the adapter.

## State mapping rule

Provider-specific payment or ownership states must map to the canonical state taxonomy in `storefront/states.json` and `@neobrutal/commerce/contracts`.

Do not invent renderer-only synonyms such as `declined`, `busy`, `paused` or `disabled-license` when the canonical state already expresses the intent.

## UX requirements

- Variable-price choices expose license scope before add-to-cart.
- Renewal terms are visible before payment.
- Discount amount and final total are visible together.
- Tax/VAT outcomes come from the adapter and remain inspectable before final submission.
- Payment failure preserves enough order/cart context to retry safely.
- Download eligibility is checked independently from simple purchase history.
- Cancellation, refund and revocation behavior is explicit and auditable.
- Components hide unsupported actions only when capability data says they are unavailable; they must not infer capabilities from a provider name.

## v0.5 implementation status

Implemented in Commerce core:
- runtime adapter validators
- strongly typed normalized view-model declarations
- canonical runtime state constants and guards
- package export at `@neobrutal/commerce/contracts`
- contract/manifest synchronization tests

Not yet implemented:
- real EDD hooks or REST adapter
- payment-gateway SDK integration
- real tax calculation
- subscription/renewal provider actions
- live refund orchestration
- live NeoLicenser API adapter

Those provider integrations should implement this contract rather than changing Commerce components to match provider-specific data.

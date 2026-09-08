# EDD Mapping Contract — v0.5

This document defines how an Easy Digital Downloads integration maps into the NeoBrutal Commerce v0.5 typed adapter boundary. Commerce does not depend on EDD; EDD is one transaction-provider implementation of the replaceable `CommerceAdapter` contract.

Commerce remains framework/backend independent. Components, renderer specs and actions consume normalized Commerce models only.

## Responsibility split

### NeoBrutal Commerce
Owns customer-facing presentation, interaction and normalized contracts:
- product detail and catalog presentation
- pricing/license choice
- cart and checkout surfaces
- invoice/tax/payment state presentation
- confirmation/account/download presentation
- shared state and ownership semantics
- provider-neutral component actions

### EDD bridge transport
Owns how the host application actually talks to Easy Digital Downloads:
- WordPress/PHP hooks
- REST or custom endpoints
- authentication/session details
- gateway/plugin-specific request shapes
- EDD extension compatibility

Commerce intentionally does not hardcode those transport details.

### `createEddCommerceAdapter()`
Owns transaction-provider normalization:
- EDD products/downloads and variable price options
- cart/order state
- authoritative subtotal/discount/tax/total values returned by the transport
- payment/checkout state mapping
- discounts and tax lines
- invoices/receipts
- refunds
- customer purchase records

Raw EDD/bridge objects stop at this adapter boundary.

### LicensingAdapter / licensing implementation
Owns software ownership translation:
- product/variant identity mapping
- license records
- entitlements
- activations/domains
- seats
- releases/update eligibility
- signed download authorization
- renewal state

Raw licensing database rows or provider SDK objects stop at the licensing boundary.

## Runtime imports

```js
import {composeCommerceRuntime} from '@neobrutal/commerce/contracts';
import {createEddCommerceAdapter} from '@neobrutal/commerce/adapters/edd';
```

Example:

```js
const commerce=createEddCommerceAdapter({
  transport:eddBridge,
  currency:'USD',
  capabilities:{
    discounts:true,
    taxes:true,
    invoices:true,
    refunds:true
  }
});

const runtime=composeCommerceRuntime({commerce,licensing});
```

The transport must implement the required transaction calls, but it may use REST, PHP-backed endpoints, server actions or another host-specific mechanism.

## EDD bridge transport contract

Required transport methods:
- `listProducts(input)`
- `getProduct(productId)`
- `getCart(cartId)`
- `addCartLine(input)`
- `removeCartLine(input)`
- `quoteCheckout(input)`
- `submitOrder(input)`
- `getOrder(orderId)`
- `listCustomerOrders(query)`

Optional:
- `requestRefund(input)` when the adapter advertises `refunds:true`

The bridge may preserve EDD-style names such as `download_id`, `price_id`, `price_options`, `cart_id`, `payment_id`, `created_at` and `receipt_url`; `createEddCommerceAdapter()` normalizes them before they reach Commerce renderers.

## EDD → CommerceAdapter mapping

| EDD/provider concept | Commerce v0.5 model / method | Rule |
| --- | --- | --- |
| Download/product | `ProductView` via `listProducts()` / `getProduct()` | Normalize IDs, copy and offers before rendering. |
| Variable price option | `ProductOffer` | Map `price_id`/option identity to stable `offerId` and concrete capacity metadata. |
| Cart | `CartView` via `getCart()` | Return normalized lines plus authoritative money totals. |
| Add/remove cart item | `addCartLine()` / `removeCartLine()` | Provider owns mutation; renderer receives resulting normalized cart. |
| Coupon/discount | `DiscountLineView[]` | UI renders returned values; it does not recalculate them. |
| Tax/VAT | `TaxLineView[]` from `quoteCheckout()` | EDD/tax provider remains authoritative for jurisdiction, rounding and validation. |
| Checkout estimate | `CheckoutQuoteView` | Expose subtotal, discounts, taxes and total together. |
| Gateway/payment outcome | `CheckoutState` | Map only to `ready`, `processing`, `failed` or `recovered`. |
| Completed order/payment | `OrderView` via `submitOrder()` / `getOrder()` | Payment completion does not itself define license/entitlement state. |
| Customer orders | `listCustomerOrders()` | Purchase history remains independent from ownership state. |
| Receipt/invoice | `OrderView.receiptUrl` and normalized metadata | Receipt implementation stays behind the adapter. |
| Refund | optional `requestRefund()` + `OrderView` | Licensing effects are resolved separately through the licensing boundary. |

## Provider state mapping

`createEddCommerceAdapter()` maps common EDD/gateway bridge states explicitly.

Checkout examples:
- `ready`, `idle`, `new` → `ready`
- `processing`, `pending` → `processing`
- `failed`, `declined`, `error` → `failed`
- `success`, `complete`, `completed` → `recovered`

Order examples:
- `pending`, `processing` → `pending`
- `complete`, `completed`, `success` → `complete`
- `failed`, `error` → `failed`
- `cancelled`, `canceled` → `cancelled`
- `refunded`, `refund` → `refunded`

Unknown provider states throw instead of creating renderer-only synonyms. If a deployment needs another provider state, normalize it in the bridge or extend the adapter mapping deliberately and test it.

## Capability contract

Commerce capabilities:
- `taxes`
- `discounts`
- `invoices`
- `refunds`

Capabilities are explicit adapter configuration. Components and actions must not infer them merely because the provider is EDD.

If `refunds:true`, the EDD bridge must implement `requestRefund()`.

Licensing capabilities remain independent:
- `activations`
- `seats`
- `renewals`
- `signedDownloads`

## Required integration rule

Never let templates, React components or agents query EDD, WordPress, payment-gateway or licensing tables directly.

Read path:

`EDD/WordPress → EDD bridge transport → createEddCommerceAdapter() → normalized Commerce model → renderer`

Action path:

`UI/agent → Commerce action → normalized runtime → EDD adapter → EDD bridge transport`

For a completed software purchase, a typical orchestration flow remains:

`EDD order complete → resolve product/offer mapping → licensing provider issues license + entitlements → CommerceAdapter returns OrderView → LicensingAdapter returns LicenseView/EntitlementView → account UI renders normalized ownership`

The orchestration may be synchronous or event-driven; the UI contract remains the same.

## Money and tax rule

Commerce UI never rebuilds provider totals from individual prices. `quoteCheckout()` and the final order response are authoritative for money calculations, including rounding, discounts, tax and total.

The adapter normalizes money shape and currency; it does not replace provider arithmetic.

## UX requirements

- Variable-price choices expose license scope before add-to-cart.
- Renewal terms are visible before payment.
- Discount amount and final total are visible together.
- Tax/VAT outcomes come from the provider bridge and remain inspectable before final submission.
- Payment failure preserves enough order/cart context to retry safely.
- Download eligibility is checked independently from simple purchase history.
- Cancellation, refund and revocation behavior is explicit and auditable.
- Components expose optional actions only when capability data says they are available.

## v0.5 implementation status

Implemented and release-gated:
- typed normalized Commerce contracts
- runtime adapter validation
- canonical state taxonomy
- reference commerce/licensing adapters
- provider-neutral action dispatcher
- declarative DOM and React action bindings
- headless and React renderer delivery
- `@neobrutal/commerce/adapters/edd`
- EDD bridge product/variable-price/cart/quote/order/refund normalization
- explicit checkout/order state mapping
- EDD adapter integration tests

Host/provider work intentionally remains outside Commerce core:
- wiring an EDD bridge to a specific WordPress installation
- gateway SDK/authentication details
- real tax provider calculation
- subscription-provider operations beyond current CommerceAdapter capabilities
- live licensing-provider/NeoLicenser API adapter

Those integrations implement the stable v0.5 boundary rather than changing Commerce components to fit provider-specific objects.

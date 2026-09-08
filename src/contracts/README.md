# Commerce Contract Runtime — v0.8

This package is the framework/backend boundary for NeoBrutal Commerce. The visual system stays CSS-first while commerce and licensing providers expose normalized models through adapters.

## Runtime import

```js
import {
  createCommerceAdapter,
  createLicensingAdapter,
  composeCommerceRuntime,
  CHECKOUT_STATES,
  OWNERSHIP_STATES,
  OWNERSHIP_OPERATION_STATES,
  SUBSCRIPTION_STATES
} from '@neobrutal/commerce/contracts';
```

TypeScript consumers receive paired declarations from `index.d.ts` through the package export.

## Core rule

Components consume normalized Commerce view models. They do not receive raw EDD downloads/orders, payment-gateway responses, WordPress records, licensing-table rows or provider SDK objects.

Provider data must be translated at the adapter boundary first.

## Commerce adapter

Required transaction operations include products, cart, checkout quote/submit, order lookup and customer order history. Optional capability flags cover provider-dependent features such as taxes, discounts, invoices, refunds and subscriptions.

`quoteCheckout()` is authoritative for customer-visible totals. Components do not reimplement tax, discount or gateway arithmetic.

## Licensing adapter

Required operations cover license and entitlement lookup. Optional capabilities may expose:
- activations
- team seats
- update renewal
- signed downloads
- plan changes
- ownership transfers/gifts
- ownership history

When an optional capability is enabled, the runtime validates that corresponding methods exist.

## Normalized models

Core transaction/ownership views:
- `ProductView`, `CartView`, `CheckoutQuoteView`, `OrderView`
- `LicenseView`, `EntitlementView`, `ActivationView`, `SeatAssignmentView`, `SignedDownloadView`

Lifecycle/billing views:
- `InvoiceView`
- `SubscriptionView`
- `PlanChangeQuoteView`
- `OwnershipTransferView`
- `OwnershipEventView`

## State contract

Runtime state IDs mirror `storefront/states.json`:
- checkout: `ready`, `processing`, `failed`, `recovered`
- system: `empty`, `loading`, `error`, `offline`, `permission`, `unsupported`
- ownership: `active`, `grace`, `expired`, `cancelled`, `refunded`
- ownership operation: `ready`, `quoted`, `processing`, `complete`, `failed`
- subscription: `active`, `cancel_at_period_end`, `cancelled`, `past_due`
- media: `preview`, `code`, `files`

Use exported guards/constants instead of inventing alternate state strings.

## Composition

```js
const runtime=composeCommerceRuntime({
  commerce:createMyCommerceAdapter(),
  licensing:createMyLicensingAdapter()
});
```

## Meaning boundaries

- `Money` is display/view data; the provider quote/order remains authoritative for arithmetic.
- Order, invoice, license, entitlement and subscription are distinct concepts.
- Seat assignment and activation are distinct scopes.
- A pending transfer does not imply ownership movement.
- `cancel_at_period_end` preserves the already-paid term unless the provider result says otherwise.
- Ownership history is adapter-returned audit data, not reconstructed UI state.

## Agent discovery

Use `storefront/components.json` to map production components to normalized models and `storefront/routes.json` to discover route intent. Agents should begin with `AGENTS.md`.

# Commerce Contract Runtime — v0.5

This package is the framework/backend boundary for NeoBrutal Commerce.

The visual system stays CSS-first. Commerce backends and licensing systems provide normalized view models through adapters. React, WordPress, static HTML and other renderers can consume the same contract without learning provider-specific database or API shapes.

## Runtime import

```js
import {
  createCommerceAdapter,
  createLicensingAdapter,
  composeCommerceRuntime,
  CHECKOUT_STATES,
  OWNERSHIP_STATES
} from '@neobrutal/commerce/contracts';
```

TypeScript consumers receive the paired declarations from `index.d.ts` automatically through the package export.

## Core rule

Components consume normalized Commerce view models. They do not receive raw EDD downloads/orders, payment-gateway responses, WordPress records, licensing-table rows or provider SDK objects.

Provider data must be translated at the adapter boundary first.

## Commerce adapter

A Commerce adapter owns transactional data and must implement:

- `listProducts`
- `getProduct`
- `getCart`
- `addCartLine`
- `removeCartLine`
- `quoteCheckout`
- `submitOrder`
- `getOrder`
- `listCustomerOrders`

Capability flags describe optional provider features such as taxes, discounts, invoices and refunds.

`quoteCheckout()` is the authoritative source for customer-visible totals. Components should not reimplement tax, discount or gateway arithmetic.

## Licensing adapter

A Licensing adapter must implement:

- `listLicenses`
- `getLicense`
- `listEntitlements`

Optional capabilities can expose:

- activations
- team seats
- update renewal
- signed downloads

When an optional capability is enabled, the runtime validates that the corresponding methods exist.

## State contract

Runtime state IDs intentionally mirror `storefront/states.json`:

- checkout: `ready`, `processing`, `failed`, `recovered`
- system: `empty`, `loading`, `error`, `offline`, `permission`, `unsupported`
- ownership: `active`, `grace`, `expired`, `cancelled`, `refunded`
- product media: `preview`, `code`, `files`

Use the exported guards instead of inventing alternate state strings.

## Composition

```js
const runtime=composeCommerceRuntime({
  commerce:createMyCommerceAdapter(),
  licensing:createMyLicensingAdapter()
});

const product=await runtime.commerce.getProduct('soft');
const licenses=await runtime.licensing.listLicenses({email:'buyer@example.com'});
```

## Money and calculation boundary

`Money` is a normalized display/view-model shape. The backing commerce adapter remains authoritative for arithmetic, rounding, taxes, discounts and final order totals. UI components render returned totals; they do not reconstruct them independently.

## Ownership boundary

A purchase, license and entitlement remain distinct objects. Cancellation, expiration and refund states must be mapped into normalized ownership results by the licensing adapter. Components render those results rather than guessing how a backend revokes or preserves access.

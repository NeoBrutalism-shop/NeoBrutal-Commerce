# Provider Examples — v0.8

Concrete integration shapes for transaction and licensing providers. These are bridge examples, not mandates for transport technology.

## EDD transaction bridge

`@neobrutal/commerce/adapters/edd` accepts an injected transport. The transport owns WordPress/EDD authentication, cookies, nonces, REST/AJAX/server-action details and provider request formats.

```js
import {createEddCommerceAdapter} from '@neobrutal/commerce/adapters/edd';

const transport={
  async listProducts({cursor,limit}={}){
    return api.listDownloads({cursor,limit});
  },
  async getProduct(productId){
    return api.getDownload(productId);
  },
  async getCart(cartId){
    return api.getCart(cartId);
  },
  async addCartLine(input){
    return api.addToCart(input);
  },
  async removeCartLine(input){
    return api.removeFromCart(input);
  },
  async quoteCheckout(input){
    return api.quoteCheckout(input);
  },
  async submitOrder(input){
    return api.submitOrder(input);
  },
  async getOrder(orderId){
    return api.getOrder(orderId);
  },
  async listCustomerOrders(query={}){
    return api.listOrders(query);
  },
  async requestRefund(input){
    return api.requestRefund(input);
  },
  async listInvoices(query={}){
    return api.listInvoices(query);
  },
  async getSubscription(subscriptionId){
    return api.getSubscription(subscriptionId);
  },
  async cancelSubscription(input){
    return api.cancelSubscription(input);
  },
  async resumeSubscription(input){
    return api.resumeSubscription(input);
  }
};

const commerce=createEddCommerceAdapter({
  transport,
  currency:'USD',
  capabilities:{refunds:true,invoiceHistory:true,subscriptions:true}
});
```

Only enable a capability when its matching transport methods exist. The EDD adapter deliberately rejects unknown commercial states instead of inventing UI meaning.

### Variable prices

The EDD bridge can normalize offer arrays from fields such as `offers`, `price_options`, `prices` or `variable_prices`. Keep the provider's price/variation identifier at the adapter boundary and expose normalized offer IDs to Commerce consumers.

### Money

EDD/provider quote and order responses remain authoritative for arithmetic. Components render normalized money; they do not recompute taxes, discounts, refunds or final totals.

## Replaceable licensing bridge

The licensing bridge lets Commerce work with NeoLicenser or another provider later without changing component contracts.

```js
import {createLicensingBridgeAdapter} from '@neobrutal/commerce/adapters/licensing-bridge';

const bridge={
  listLicenses:query=>licenseApi.listLicenses(query),
  getLicense:id=>licenseApi.getLicense(id),
  listEntitlements:query=>licenseApi.listEntitlements(query),
  listActivations:id=>licenseApi.listActivations(id),
  listSeats:id=>licenseApi.listSeats(id),
  assignSeat:input=>licenseApi.assignSeat(input),
  removeSeat:input=>licenseApi.removeSeat(input),
  renewUpdates:input=>licenseApi.renew(input),
  createSignedDownload:input=>licenseApi.createDownload(input),
  quotePlanChange:input=>licenseApi.quotePlanChange(input),
  changePlan:input=>licenseApi.changePlan(input),
  listTransfers:input=>licenseApi.listTransfers(input),
  createTransfer:input=>licenseApi.createTransfer(input),
  cancelTransfer:input=>licenseApi.cancelTransfer(input),
  listOwnershipEvents:input=>licenseApi.listHistory(input)
};

const licensing=createLicensingBridgeAdapter({
  bridge,
  capabilities:{
    activations:true,
    seats:true,
    renewals:true,
    signedDownloads:true,
    planChanges:true,
    transfers:true,
    ownershipHistory:true
  },
  normalize:{
    license:normalizeLicense,
    entitlement:normalizeEntitlement,
    activation:normalizeActivation,
    seat:normalizeSeat,
    signedDownload:normalizeSignedDownload,
    planChangeQuote:normalizePlanChangeQuote,
    transfer:normalizeTransfer,
    ownershipEvent:normalizeOwnershipEvent
  }
});
```

If a bridge already returns normalized Commerce models, the corresponding normalizer may be omitted because the bridge defaults to identity mapping. Provider-native shapes should use explicit normalizers.

## Capability-driven UI

Do not render controls because a provider has a particular brand name. Read capabilities from the adapter/runtime.

Examples:

- refunds require transaction `refunds` capability;
- subscription controls require transaction `subscriptions` capability;
- seat controls require licensing `seats` capability;
- plan change requires licensing `planChanges` capability;
- transfer/gift requires licensing `transfers` capability;
- ownership timeline requires licensing `ownershipHistory` capability.

If a capability is absent, omit or intentionally render an `unsupported` state. Do not leave a control that will fail only after click.

## Provider state mapping

Map provider values at the adapter boundary into canonical Commerce states. Do not invent synonyms in pages/components.

Examples of semantic distinctions that must survive normalization:

- checkout `failed` vs `recovered`;
- subscription `cancel_at_period_end` vs `cancelled`;
- license `grace` vs `expired`;
- ownership operation `quoted` vs `complete`.

## Full composition

```js
import {composeCommerceRuntime} from '@neobrutal/commerce/contracts';
import {createActionDispatcher} from '@neobrutal/commerce/actions';

const runtime=composeCommerceRuntime({commerce,licensing});
const actions=createActionDispatcher(runtime);
```

From this point forward, renderers and agents use only normalized models, capabilities and canonical actions.

See `docs/EDD-MAPPING.md` and `docs/OWNERSHIP-LIFECYCLE.md` for the deeper semantic contracts.
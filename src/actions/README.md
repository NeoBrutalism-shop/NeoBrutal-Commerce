# Commerce actions — v0.8

Actions are framework-neutral user/application intents executed against a composed Commerce runtime.

```js
import {createCommerceAction,createActionDispatcher} from '@neobrutal/commerce/actions';

const dispatcher=createActionDispatcher(runtime,{onEvent(event){
  // start | success | error
}});

await dispatcher.dispatch(createCommerceAction('cart.add',{
  productId:'soft',
  offerId:'team'
}));
```

## Canonical actions

Purchase/core:
- `cart.add`
- `cart.remove`
- `checkout.quote`
- `checkout.submit`
- `order.refund`
- `download.create`

License/entitlement:
- `license.activations.list`
- `license.seats.list`
- `seat.assign`
- `seat.remove`
- `license.renew`

Billing/ownership:
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

Optional actions are capability-gated. A command must not execute merely because a provider name suggests support; the normalized adapter capability and method must exist.

## Action lifecycle

`createActionDispatcher()` emits normalized lifecycle events for start/success/error. Metadata such as `id`, `source` and `correlationId` is suitable for status/telemetry, not commercial truth.

Provider results remain authoritative for price, billing, entitlement and ownership consequences.

## Boundary

`UI/agent intent → Commerce action → normalized runtime → provider adapter`

Do not dispatch provider-specific commands from components. Keep provider IDs or opaque provider metadata inside normalized payload fields only where the adapter contract explicitly requires them.

## Agent lookup

`storefront/components.json` lists the canonical actions appropriate for each production component. `docs/AGENT-PLAYBOOK.md` describes the mutation workflow agents should follow.

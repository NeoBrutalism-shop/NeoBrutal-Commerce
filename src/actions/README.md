# Commerce actions — v0.5

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

Canonical actions:

- `cart.add`
- `cart.remove`
- `checkout.quote`
- `checkout.submit`
- `order.refund`
- `license.activations.list`
- `license.seats.list`
- `seat.assign`
- `seat.remove`
- `license.renew`
- `download.create`

Optional actions are capability-gated. For example, `order.refund` will not execute unless the transaction adapter exposes `refunds: true` and `requestRefund()`. The same rule applies to seats, activations, renewals and signed downloads.

The action boundary is:

`UI/agent intent -> Commerce action -> normalized runtime -> provider adapter`

Do not dispatch provider-specific commands from components. Keep provider IDs or opaque provider metadata inside normalized payload fields only when the adapter contract explicitly requires them.

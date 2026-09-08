# Commerce Recipes — v0.8

Copy-paste starting points for adopting NeoBrutal Commerce without bypassing its normalized contracts.

## 1. Fastest local sandbox

Use the deterministic reference runtime when you want to prototype UI without a backend.

```js
import '@neobrutal/commerce/styles.css';
import {createReferenceRuntime} from '@neobrutal/commerce/adapters/reference';
import {createActionDispatcher,createCommerceAction} from '@neobrutal/commerce/actions';

const runtime=createReferenceRuntime();
const actions=createActionDispatcher(runtime);

const product=await runtime.commerce.getProduct('soft');
const cart=await actions.dispatch(createCommerceAction('cart.add',{
  productId:'soft',
  offerId:'team',
  quantity:1
}));
```

Use this for component work, demos and integration tests. Replace the adapters—not the component contracts—when moving to production.

## 2. Framework-neutral product HTML

```js
import {createProductCardSpec,renderSpecToHtml} from '@neobrutal/commerce/renderers/headless';

const product=await runtime.commerce.getProduct('soft');
const spec=createProductCardSpec(product,{offerId:'team'});
const html=renderSpecToHtml(spec);
```

Renderer specs are semantic DOM descriptions. Preserve their `data-commerce-component` anatomy when wrapping or styling them.

## 3. Declarative action controls

```js
import {createCommerceAction} from '@neobrutal/commerce/actions';
import {createActionAttributes,bindCommerceActions} from '@neobrutal/commerce/actions/bindings';

const action=createCommerceAction('cart.add',{
  productId:'soft',
  offerId:'team',
  quantity:1
});

const button=document.querySelector('#buy-team');
for(const [name,value] of Object.entries(createActionAttributes(action))){
  button.setAttribute(name,value);
}

const binding=bindCommerceActions(document,actions,{
  onError(error){console.error(error);}
});

// Later: binding.unbind();
```

Do not attach provider-specific callbacks to Commerce controls when a canonical action exists.

## 4. React action card

React is supplied by the host application.

```js
import React from 'react';
import {createCommerceAction} from '@neobrutal/commerce/actions';
import {createReactActionBindings} from '@neobrutal/commerce/renderers/react-actions';

const {ProductActionCard}=createReactActionBindings(React,actions);
const action=createCommerceAction('cart.add',{
  productId:product.id,
  offerId:'team',
  quantity:1
});

// <ProductActionCard product={product} action={action} />
```

The React layer uses the same normalized product/action contract as the headless renderer.

## 5. Plan-change quote before mutation

```js
const quote=await actions.dispatch(createCommerceAction('license.change.quote',{
  licenseId:'demo-soft-team',
  toOfferId:'individual',
  effective:'next_term'
}));

if(quote){
  await actions.dispatch(createCommerceAction('license.change.submit',{
    licenseId:'demo-soft-team',
    toOfferId:'individual',
    effective:'next_term',
    quoteId:quote.id
  }));
}
```

Never bypass the quote step when the lifecycle consequence needs to be shown to the customer first.

## 6. Theme switch

```js
document.documentElement.dataset.theme='dark';
// or: document.documentElement.dataset.theme='light';
```

Override semantic tokens rather than component selectors. See `docs/THEMING.md`.

## 7. Production adapter composition

```js
import {composeCommerceRuntime} from '@neobrutal/commerce/contracts';
import {createEddCommerceAdapter} from '@neobrutal/commerce/adapters/edd';
import {createLicensingBridgeAdapter} from '@neobrutal/commerce/adapters/licensing-bridge';

const commerce=createEddCommerceAdapter({transport:eddTransport});
const licensing=createLicensingBridgeAdapter({
  bridge:licensingTransport,
  capabilities:{activations:true,seats:true,signedDownloads:true},
  normalize:{license:normalizeLicense,entitlement:normalizeEntitlement,activation:normalizeActivation,seat:normalizeSeat,signedDownload:normalizeSignedDownload}
});

const runtime=composeCommerceRuntime({commerce,licensing});
```

The transport may use REST, server actions, RPC, WordPress AJAX or another mechanism. That transport detail must stop at the adapter boundary.

## Validation loop

```bash
npm run check
npm run test:browser
```

Also use `storefront/routes.json`, `storefront/components.json` and `storefront/states.json` as the machine-readable implementation contract.
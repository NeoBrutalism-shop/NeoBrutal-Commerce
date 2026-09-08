# Commerce renderers — v0.5

Renderers consume only the normalized types from `@neobrutal/commerce/contracts`. Provider-native EDD, licensing, CMS, API or database objects must be normalized by an adapter first.

## Headless

Import `@neobrutal/commerce/renderers/headless` to create semantic renderer specs:

```js
import {createProductCardSpec,renderSpecToHtml} from '@neobrutal/commerce/renderers/headless';

const spec=createProductCardSpec(product,{offerId:'team'});
const html=renderSpecToHtml(spec);
```

A renderer spec is a small immutable DOM description with `tag`, `props` and `children`. It preserves stable classes and `data-commerce-component` anatomy without requiring a framework.

Current builders:

- `createProductCardSpec(ProductView)`
- `createOrderSummarySpec(CartView | CheckoutQuoteView)`
- `createSystemStateSpec(...)`
- `createLicenseCardSpec(LicenseView)`
- `createSeatAssignmentSpec(SeatAssignmentView[])`
- `createActivationListSpec(ActivationView[])`

`renderSpecToHtml()` escapes text and attributes and intentionally drops function-valued props.

## React

React is not bundled or version-pinned by Commerce. Inject the React runtime you already use:

```js
import React from 'react';
import {createReactBindings} from '@neobrutal/commerce/renderers/react';

const {ProductCard,OrderSummary,SystemState}=createReactBindings(React);
```

The returned components render the same headless specs, so React cannot silently diverge from HTML/server/custom-framework output.

## shadcn-style use

Treat these bindings as copyable delivery primitives:

1. keep Commerce normalized models as component inputs;
2. keep `data-commerce-component` attributes intact;
3. compose behavior around the renderer instead of replacing its semantic anatomy;
4. import `@neobrutal/commerce/styles.css` or copy the relevant component CSS into the consuming project;
5. do not put provider objects directly into component props.

## Boundary

`provider object -> adapter -> normalized Commerce view -> renderer spec -> framework/HTML`

This is the same boundary used by the production storefront and adapter contracts.

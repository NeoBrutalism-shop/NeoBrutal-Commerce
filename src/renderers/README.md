# Commerce renderers — v0.8

Renderers consume only normalized types from `@neobrutal/commerce/contracts`. Provider-native EDD, licensing, CMS, API or database objects must be normalized by an adapter first.

## Headless read surfaces

Import `@neobrutal/commerce/renderers/headless` to create semantic renderer specs:

```js
import {createProductCardSpec,renderSpecToHtml} from '@neobrutal/commerce/renderers/headless';

const spec=createProductCardSpec(product,{offerId:'team'});
const html=renderSpecToHtml(spec);
```

A renderer spec is a small immutable DOM description with `tag`, `props` and `children`. It preserves stable classes and `data-commerce-component` anatomy without requiring a framework.

Core builders cover product cards, order summaries, system states, license cards, seat assignment and activations.

## React read surfaces

React is not bundled or version-pinned by Commerce. Inject the React runtime already used by the host application:

```js
import React from 'react';
import {createReactBindings} from '@neobrutal/commerce/renderers/react';

const {ProductCard,OrderSummary,SystemState}=createReactBindings(React);
```

React renders the same normalized specs so framework output cannot silently diverge from headless/server output.

## Canonical action controls

Use:
- `@neobrutal/commerce/renderers/action-controls`
- `@neobrutal/commerce/renderers/react-actions`

These bind UI controls to canonical Commerce actions rather than provider callbacks.

## Ownership lifecycle renderers

Use:
- `@neobrutal/commerce/renderers/ownership`
- `@neobrutal/commerce/renderers/react-ownership`

Lifecycle surfaces include plan-change quote/apply, transfer lists, subscription management, invoice history and ownership timeline.

## shadcn-style use

Treat bindings as copyable delivery primitives:
1. keep normalized Commerce models as component inputs;
2. keep `data-commerce-component` attributes intact;
3. compose behavior around renderer anatomy instead of replacing semantics;
4. import `@neobrutal/commerce/styles.css` or copy relevant core CSS;
5. never put provider objects directly into component props.

## Agent discovery

`storefront/components.json` records which models/actions/states belong to each production component. `docs/AI-COMPONENT-NOTES.md` documents high-risk generation decisions.

## Boundary

`provider object → adapter → normalized Commerce view → renderer spec → framework/HTML`

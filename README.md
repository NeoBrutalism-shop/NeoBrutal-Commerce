# NeoBrutal Commerce

**Expressive Neo-Brutalism for digital-product, software and creator commerce.**

Commerce is a flavor of the NeoBrutalism family. It shares the same tactile interaction grammar as Soft and Rivet, but uses a louder retail material: stronger price hierarchy, promotional bands, boxed-product surfaces, physical press depth and conversion-oriented workflows.

## Status

`0.5.0-dev` — production storefront system plus typed adapters, framework-neutral renderers and provider-neutral action contracts.

## Current production surface

- light/dark semantic tokens and fluid `clamp()` foundations
- tactile buttons and retail surfaces — compress, never float
- storefront home, product catalog and product detail routes
- rich product media: UI preview, code preview and file/content preview
- review summary, contextual testimonials and adapter-backed guarantee/trust contract
- Individual / Team / Agency license selection
- pricing tiers, responsive comparison tables and optional bundle builder
- persistent cart → checkout → order state
- checkout invoice details, tax/VAT input, processing, failure and recovery states
- order confirmation and entitlement handoff
- customer account downloads, purchase history and license ownership
- activation/site capacity, responsive ownership tables and update eligibility
- team-seat assignment and renewal lifecycle patterns
- active, grace, expired, cancelled and refunded ownership states
- empty, loading, error, offline, permission and unsupported system states
- machine-readable product, route and state contracts
- framework-neutral runtime adapter validation
- TypeScript declarations for normalized product/cart/checkout/order/license/entitlement models
- dependency-free headless renderer specs with safe HTML serialization
- React bindings generated from the same headless anatomy
- typed commands for cart, checkout, refund, seats, activations, renewal and signed downloads

## Production routes

- `/` — storefront home
- `/products` — catalog
- `/product/soft` — product detail, media, reviews and license selection
- `/pricing` — plans, comparison and bundles
- `/cart` — full cart
- `/checkout` — contact, invoice/tax, payment and recovery states
- `/order/success` — receipt and entitlement
- `/account` — downloads, purchases and licenses
- `/account/license/:id` — activations, seats, updates and renewal
- `/components` — component and state showcase

The legacy `demo/v02.html` workflow remains as regression coverage while production validation happens on the real routes above.

## Typed contract package

Use the CSS system and contract runtime independently or together:

```js
import '@neobrutal/commerce/styles.css';
import {
  createCommerceAdapter,
  createLicensingAdapter,
  composeCommerceRuntime
} from '@neobrutal/commerce/contracts';
```

TypeScript consumers receive declarations automatically from the `./contracts` export.

The normalized contract covers:
- products and offers
- carts, discounts, taxes and totals
- invoice and checkout state
- orders and purchase history
- licenses and entitlements
- activations and team seats
- renewal and signed-download capabilities
- canonical checkout/system/ownership/media states

Components do **not** receive raw EDD, WordPress, gateway SDK, database-row or licensing-provider objects. Provider adapters translate those objects into Commerce view models first.

## Renderer delivery

Headless rendering is dependency-free:

```js
import {
  createProductCardSpec,
  createOrderSummarySpec,
  renderSpecToHtml
} from '@neobrutal/commerce/renderers/headless';
```

React remains optional and is injected from the consuming app:

```js
import React from 'react';
import {createReactBindings} from '@neobrutal/commerce/renderers/react';

const {ProductCard,OrderSummary,SystemState}=createReactBindings(React);
```

Both surfaces render the same immutable spec anatomy and stable `data-commerce-component` identifiers. That makes the React/shadcn-style layer a delivery mechanism rather than a second design-system contract.

Current renderer builders cover product cards, order summaries, system states, license cards, seat assignment and activation lists. See `src/renderers/README.md` for copy/use rules.

## Action delivery

UI and agent intent use the same provider-neutral command surface:

```js
import {createActionDispatcher,createCommerceAction} from '@neobrutal/commerce/actions';

const actions=createActionDispatcher(runtime,{onEvent(event){
  // start | success | error
}});

await actions.dispatch(createCommerceAction('cart.add',{
  productId:'soft',
  offerId:'team'
}));
```

Canonical commands cover cart add/remove, checkout quote/submit, refunds, activation/seat queries, seat assignment/removal, renewal and signed downloads. Optional commands are capability-gated by the normalized adapters rather than provider names.

Components and agents should dispatch Commerce commands instead of calling EDD, gateway or licensing APIs directly. The behavioral boundary is:

`UI/agent intent → Commerce action → normalized runtime → provider adapter`

See `src/actions/README.md` for the command list and dispatcher lifecycle.

## Machine-readable contracts

- `storefront/catalog.json` — product/license/review/renewal metadata
- `storefront/routes.json` — route intent and component/state coverage
- `storefront/states.json` — checkout, system, ownership and media state taxonomy
- `src/contracts/runtime.js` — runtime state guards and adapter validators
- `src/contracts/index.d.ts` — TypeScript normalized view-model and adapter interfaces
- `src/contracts/README.md` — adapter authoring rules
- `src/actions/runtime.js` — provider-neutral action execution and dispatch lifecycle
- `src/actions/index.d.ts` — discriminated typed action commands
- `src/renderers/headless.js` — framework-neutral semantic renderer specs
- `src/renderers/react.js` — React bindings over the headless specs
- `LLMS.md` — generation and commerce-semantic rules for agents

## Architecture

The foundation is CSS-first and framework/backend-independent. React/shadcn wrappers are renderers over the same contract, not a second contract. EDD or another commerce backend can own transaction lifecycle; NeoLicenser or another licensing backend can own licensing/entitlements/releases; Commerce owns the customer-facing interaction language and normalized component/view-model/action boundary.

The read path is:

`provider data/event → provider adapter → normalized Commerce model → renderer spec → framework/HTML`

The action path is:

`UI/agent intent → Commerce action → normalized runtime → provider adapter`

See `docs/EDD-MAPPING.md` for the first provider mapping contract.

## Quality gates

`npm run check` runs static conformance, v0.5 runtime/manifest synchronization tests, reference-adapter journey tests, renderer parity/escaping tests and action lifecycle/capability tests. Browser QA continues to validate production routes, accessibility, interaction state and responsive behavior across desktop and mobile Chromium.

## License

`UNLICENSED` while the public-core/commercial packaging strategy is finalized.

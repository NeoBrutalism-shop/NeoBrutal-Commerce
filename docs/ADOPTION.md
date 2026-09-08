# Adopting NeoBrutal Commerce

NeoBrutal Commerce is a provider-neutral UI/runtime layer for digital-product and software commerce. Adoption succeeds when the application renders normalized models, dispatches canonical actions, and keeps provider details behind adapters.

## 1. Start from the normalized runtime

Import the surfaces your application needs instead of copying provider objects into components.

```js
import '@neobrutal/commerce/styles.css';
import {composeCommerceRuntime} from '@neobrutal/commerce/contracts';
import {createActionDispatcher} from '@neobrutal/commerce/actions';

const runtime=composeCommerceRuntime({commerce,licensing});
const actions=createActionDispatcher(runtime);
```

The normalized runtime is the application boundary. Transaction data implements `CommerceAdapter`; licensing/ownership data implements `LicensingAdapter`.

## 2. Choose a rendering layer

Use the smallest delivery layer that matches the host application:

- static/HTML: core CSS + semantic `data-commerce-component` anatomy
- framework-neutral JS: `@neobrutal/commerce/renderers/headless`
- React: `@neobrutal/commerce/renderers/react`
- action controls: `@neobrutal/commerce/renderers/action-controls` or `react-actions`
- ownership lifecycle: `@neobrutal/commerce/renderers/ownership` or `react-ownership`

React is supplied by the consuming application; Commerce does not bundle or pin it.

## 3. Choose adapters by capability, not brand

Provider transports/auth/session behavior are injected at the adapter layer. The UI reads capability flags before exposing optional features such as refunds, activations, seats, signed downloads, subscriptions, plan changes, transfers or ownership history.

Do not branch component behavior on strings such as `edd`, `wordpress`, a gateway name or a licensing vendor name.

## 4. Build from the production manifests

Use these machine-readable sources before hand-authoring a page:

- `storefront/routes.json` — route intent and required primary components
- `storefront/components.json` — component models, canonical actions, states and agent rules
- `storefront/states.json` — canonical state semantics
- `storefront/catalog.json` — reference product/license metadata

A route can add application-specific content, but the normalized commercial/ownership meaning must remain intact.

## 5. Theme without forking component logic

Set `data-theme="light"` or `data-theme="dark"` on the document root. Use semantic tokens instead of hard-coded theme colors. Keep the tactile law intact in both themes: hover compresses depth and active press consumes it.

Use fluid `clamp()` type/spacing scales where possible. Keep focus, reduced-motion and forced-colors behavior working in every theme.

## 6. Preserve transaction and ownership meaning

Keep these distinct:

- order = transaction
- invoice = billing record
- license = owned scope
- entitlement = current use/download/update rights
- subscription = future recurring billing
- seat = person assignment
- activation = site/domain/device scope
- transfer/gift = ownership movement workflow
- ownership event = auditable provider-returned history

For plan changes, quote before mutation. A pending transfer does not mean ownership moved. `cancel_at_period_end` does not revoke an already-paid term.

## 7. Validate adoption

Run the full release loop before merging host changes that alter Commerce behavior:

```bash
npm run check
npm run test:browser
```

`npm run check` validates static conformance, documentation/component-registry consistency, contracts, renderers, actions, adapters, ownership lifecycle and payload/performance budgets. Browser QA validates the real production routes across Chromium, mobile Chromium, Firefox and WebKit, including strict accessibility and canonical visual surfaces.

## Adoption checklist

- provider objects stop at adapters
- normalized models cross the UI boundary
- canonical actions cross the mutation boundary
- optional controls are capability-gated
- canonical states are reused rather than renamed
- price, renewal and license scope are inspectable before purchase
- light/dark themes use semantic tokens
- tactile controls compress rather than float
- keyboard/focus/reduced-motion/forced-colors behavior is preserved
- `npm run check` and `npm run test:browser` are green

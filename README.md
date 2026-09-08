# NeoBrutal Commerce

**Expressive Neo-Brutalism for digital-product, software and creator commerce.**

Commerce is a flavor of the NeoBrutalism family. It shares the same tactile interaction grammar as Soft and Rivet, but uses a louder retail material: stronger price hierarchy, promotional bands, boxed-product surfaces, physical press depth and conversion-oriented workflows.

## Status

`0.5.0-dev` — production storefront system plus typed, replaceable commerce/licensing adapter contracts.

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

## Machine-readable contracts

- `storefront/catalog.json` — product/license/review/renewal metadata
- `storefront/routes.json` — route intent and component/state coverage
- `storefront/states.json` — checkout, system, ownership and media state taxonomy
- `src/contracts/runtime.js` — runtime state guards and adapter validators
- `src/contracts/index.d.ts` — TypeScript normalized view-model and adapter interfaces
- `src/contracts/README.md` — adapter authoring rules
- `LLMS.md` — generation and commerce-semantic rules for agents

## Architecture

The foundation is CSS-first and framework/backend-independent. React/shadcn wrappers are renderers over the same contract, not a second contract. EDD or another commerce backend can own transaction lifecycle; NeoLicenser or another licensing backend can own licensing/entitlements/releases; Commerce owns the customer-facing interaction language and normalized component/view-model boundary.

The integration path is always:

`provider data/event → provider adapter → normalized Commerce model → renderer/component`

See `docs/EDD-MAPPING.md` for the first provider mapping contract.

## Quality gates

`npm run check` runs static conformance plus v0.5 runtime/manifest synchronization tests. Browser QA continues to validate production routes, accessibility, interaction state and responsive behavior across desktop and mobile Chromium.

## License

`UNLICENSED` while the public-core/commercial packaging strategy is finalized.

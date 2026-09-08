# NeoBrutal Commerce

**Expressive Neo-Brutalism for digital-product, software and creator commerce.**

Commerce is a flavor of the NeoBrutalism family. It shares the same tactile interaction grammar as Soft and Rivet, but uses a louder retail material: stronger price hierarchy, promotional bands, boxed-product surfaces, physical press depth and conversion-oriented workflows.

## Status

`0.4.0-dev` — multi-page storefront architecture plus production state/component completeness.

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

## Machine-readable contracts

- `storefront/catalog.json` — product/license/review/renewal metadata
- `storefront/routes.json` — route intent and component/state coverage
- `storefront/states.json` — checkout, system, ownership and media state taxonomy
- `LLMS.md` — generation and commerce-semantic rules for agents

## Architecture

The foundation is CSS-first and framework/backend-independent. React/shadcn wrappers and commerce backends are adapters, not prerequisites. EDD or another commerce backend can own transaction lifecycle; NeoLicenser or another licensing backend can own licensing/entitlements/releases; Commerce owns the customer-facing interaction language and component contracts.

## License

`UNLICENSED` while the public-core/commercial packaging strategy is finalized.

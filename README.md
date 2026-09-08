# NeoBrutal Commerce

**Expressive Neo-Brutalism for digital-product, software and creator commerce.**

Commerce is a flavor of the NeoBrutalism family. It shares the same tactile interaction grammar as Soft and Rivet, but uses a louder retail material: stronger price hierarchy, promotional bands, boxed-product surfaces, 6px depth and conversion-oriented workflows.

## Status

`0.2.0-dev` — full storefront workflow milestone.

## v0.2 includes

- light/dark semantic tokens and fluid `clamp()` foundations
- tactile buttons and retail surfaces — compress, never float
- product cards and product-detail gallery
- Individual / Team / Agency license selection
- pricing tiers and comparison table
- optional bundle builder with no preselected upsells
- mini-cart drawer
- coupon states
- checkout details + payment-method pattern
- transparent totals and renewal language
- order confirmation
- customer account navigation
- downloads and purchase history
- license status, activation/site scope and update eligibility
- future EDD mapping contract

## Demo

Open `demo/v02.html` for the v0.2 storefront workflow lab. `demo/index.html` preserves the original v0.1 foundation demo.

## Architecture

The foundation is CSS-first and framework-independent. React/shadcn wrappers and commerce backends are adapters, not prerequisites. EDD will own transaction lifecycle; NeoLicenser will own licensing/entitlements/releases; Commerce owns the customer-facing interaction language.

## License

`UNLICENSED` while the public-core/commercial packaging strategy is finalized.

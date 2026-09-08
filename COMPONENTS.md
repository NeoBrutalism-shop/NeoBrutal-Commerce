# Component Surface — v0.4

## Foundation
- tokens
- light/dark themes
- fluid type and spacing
- tactile depth physics
- reduced motion
- forced colors

## Storefront
- Button
- Product card
- Product art
- Badge
- Price block
- Feature list
- License selector
- Product detail
- Product gallery + thumbnails
- Product media tabs / code / file preview
- Product metadata
- Review summary
- Testimonials
- Guarantee / trust block
- Renewal note
- Responsive data table

## Pricing
- Pricing tiers
- Featured plan treatment
- Plan comparison table
- Bundle builder
- Bundle totals

## Cart and checkout
- Cart item
- Mini-cart drawer
- Order summary
- Coupon input/status
- Checkout field
- Checkout steps
- Invoice details
- Tax / VAT input
- Payment method
- Payment failure
- Payment processing
- Payment recovery
- Trust strip
- Order confirmation / receipt

## Account and ownership
- Account navigation/tabs
- Download row
- Purchase-history row
- License card
- License status
- Masked license key
- Activation/site rows
- Update eligibility
- Renewal lifecycle
- Team-seat assignment
- Entitlement note
- Active / grace / expired / cancelled / refunded states

## System states
- Empty
- Loading / skeleton
- Error
- Offline
- Permission denied
- Unsupported feature/browser

## Production page patterns
- Storefront/home
- Product catalog
- Product detail + rich media + reviews
- Pricing/comparison/bundles
- Full cart
- Checkout + invoice/tax + payment recovery
- Order success
- Account dashboard
- License detail + activations + seats + renewal
- Component/state showcase

## Machine-readable contracts
- `storefront/catalog.json` — products, licenses, review/guarantee/renewal metadata
- `storefront/routes.json` — route intent, primary components and supported route states
- `storefront/states.json` — checkout, system, ownership and media state taxonomy

## Next
- upgrade/downgrade ownership flows
- gift/transfer ownership
- invoice/receipt history and richer tax outcomes
- subscription management actions
- React/shadcn wrappers
- typed component APIs/events
- EDD adapter mapping implementation
- visual regression baselines and broader cross-browser coverage

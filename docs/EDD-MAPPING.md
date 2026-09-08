# EDD Mapping Contract — Draft v0.2

This document defines how NeoBrutal Commerce UI concepts are expected to map to Easy Digital Downloads later. It is intentionally a boundary contract, not an implementation.

## Responsibility split

### NeoBrutal Commerce
Owns customer-facing presentation and interaction patterns:
- product detail
- pricing/license choice
- cart and checkout surfaces
- confirmation/account/download presentation

### Easy Digital Downloads
Owns commerce transaction lifecycle:
- products/prices
- cart/order state
- taxes
- discounts
- payment gateways
- receipts/refunds
- customer purchase records

### NeoLicenser
Owns licensing and software entitlement lifecycle:
- product/variant identity
- license creation
- entitlements
- activations/domains/seats
- releases/update eligibility
- signed download authorization

## Concept mapping

| Commerce UI | EDD concept | NeoLicenser concept |
| --- | --- | --- |
| Product | Download | Product |
| Individual/Team/Agency choice | Variable price option | Plan / product variant |
| Cart line | Cart item | none yet |
| Successful order | Payment/Order | license issuance trigger |
| Customer account purchase | Order/customer | Customer link |
| Download button | File/download entitlement check | Entitlement + Release |
| License card | custom account surface | License |
| Sites / activations | not owned by EDD | Activations |
| Update window | renewal/order metadata | Entitlement expiration |
| Coupon | Discount code | none |

## Required adapter rule

Never let templates query licensing tables directly. The EDD adapter should translate EDD events into NeoLicenser public APIs/events, then Commerce renders normalized view models.

Example future flow:

`EDD order complete → resolve product/price mapping → NeoLicenser issue license + entitlements → account UI reads normalized ownership data`

## UX requirements
- Variable-price choices must expose license scope before add-to-cart.
- Renewal terms must be visible before payment.
- Discount amount and final total must be visible together.
- Download eligibility must be checked independently from simple purchase history.
- Refund/revocation behavior must be explicit and auditable.

## Not implemented in v0.2
- real EDD hooks/templates
- gateway integration
- tax calculation
- subscription renewals
- refunds
- NeoLicenser API calls

Those belong after Commerce workflows and NeoLicenser Core are stable enough to dogfood together.

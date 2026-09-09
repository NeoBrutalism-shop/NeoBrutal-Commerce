# NeoBrutal Commerce — Design Direction

NeoBrutal Commerce is the retail/conversion flavor of the NeoBrutalism family.

## Personality

- expressive, not chaotic
- conversion-focused, not manipulative
- tactile, not floaty
- playful, not childish
- dense enough for commerce, clear enough for software buyers

## Shared family laws

1. **Compress, never float.** Hover reduces depth; press consumes the remaining shadow without moving the pointer hit target during activation.
2. Shadow communicates physical depth, not decoration.
3. Fluid `clamp()` scales are preferred to breakpoint piles.
4. Light and dark themes are required.
5. Focus, reduced-motion and forced-colors behavior are product requirements.
6. Motion communicates cause, state and result.

## Commerce material model

Commerce should feel like printed packaging, checkout buttons, price stickers and boxed software—not like Soft with brighter colors.

- structural border: 2–3px
- standard raised depth: 6px
- hover compression: 3px downward on fine pointers
- active compression: consume the full remaining shadow while retaining the hover-compressed hit position; coarse pointers keep the control at its origin
- pricing typography: oversized and compact
- promo accents: yellow, coral, lime, sky and pink
- surfaces: warm paper / ink in light mode, charcoal / cream in dark mode

The active rule is intentional browser-hardening: tactile feedback must never make the clickable element move away from the pointer between `pointerdown` and `click`. Safari/WebKit compatibility is part of the design contract, not a test exception.

## Conversion ethics

The design system must make price, renewal terms, license scope, discounts and consequences legible before purchase. No hidden fees, fake urgency, preselected expensive options or dark-pattern countdowns.

# Motion & Interaction v1.3

NeoBrutal Commerce uses motion as interaction feedback, not decoration. The shipping Commerce runtime and npm API remain frozen at `1.0.0`; v1.3 adds a design-system interaction contract beside that runtime without creating a new package export.

The machine-readable authority for this layer is `storefront/interactions.json`. Human guidance here explains the same contract. Existing `DESIGN.md` and `LLMS.md` family laws remain authoritative: **Compress, never float.** Motion communicates cause, state, and result.

## Contract boundary

`storefront/interactions.json` describes how existing Commerce surfaces should feel and how those behaviors must degrade safely. It does not redefine route intent, component models, canonical runtime states, actions, Blocks, Pages, provider data, or package exports.

Use the existing hierarchy unchanged:

`Components → Blocks → Pages → Applications`

Interaction guidance applies across those layers. Runtime meaning still comes from the frozen Commerce contracts and manifests.

## Public Motion & Interaction Lab

`demo/v13.html` is the permanent v1.3 inspection surface. It consumes `storefront/interactions.json` directly and exposes exactly the four production interaction patterns plus the explicit `drag-lift` exception.

The lab is evidence-led rather than a parallel implementation:

- tactile press uses the shipping `.nbc-tactile` class and resolves the real interaction token values;
- latched selection uses the production media markup and the same `storefront/store.js` keyboard/pointer controller;
- processing feedback uses the shipping system-state skeleton and keeps explicit loading copy visible;
- result feedback uses the production subscription-management controller and persistent `data-subscription-state` result;
- `drag-lift` is shown only as **not a production pattern** because Commerce does not currently ship a draggable interaction.

The lab exposes normal system motion preference and a clearly labeled reduced-motion preview override for documentation. That override is not the accessibility gate: Browser QA separately emulates the actual `prefers-reduced-motion: reduce` preference and forced-colors mode against the shipping CSS.

## Production interaction patterns

### Tactile press

Raised `.nbc-tactile` controls behave like physical controls with depth:

- rest uses the standard raised depth;
- fine-pointer hover compresses into that depth rather than lifting upward;
- active consumes the remaining shadow while keeping the pointer hit target stable through activation;
- coarse-pointer active feedback consumes the shadow without translating the target away from the touch point;
- keyboard activation preserves the same semantic action and visible focus behavior.

The relevant tokens are `--nbc-depth`, `--nbc-press-hover`, `--nbc-press-active`, `--nbc-ease-press`, `--nbc-ease-release`, `--nbc-motion-fast`, and `--nbc-motion-standard`.

### Latched selection

Selection is persistent state, not a temporary hover effect. Product media is the current production example: the selected tab remains visibly latched, exposes `aria-selected`, and supports pointer plus left/right arrow-key selection.

### Processing feedback

Loading animation may reinforce that work is in progress, but animation cannot be the only status signal. The existing skeleton shimmer becomes static under `prefers-reduced-motion: reduce`; the surrounding state content remains responsible for meaning.

### Result feedback

Commerce mutations expose persistent textual and programmatic results. Plan changes, ownership transfers, and subscription controls update explicit lifecycle state after the action. Animation is optional reinforcement and must never become the authoritative record of success, failure, cancellation, or recovery.

## Reduced motion and forced colors

Reduced motion and forced colors are product requirements:

- tactile transitions collapse under reduced motion;
- skeleton animation stops under reduced motion;
- state and selection meaning remains available through text and programmatic state;
- decorative depth is removed where forced colors requires it;
- focus and state cannot depend on shadow, animation, or color alone.

The Motion Lab demonstrates both normal and reduced-motion presentation. Browser QA verifies the actual media preference rather than relying on implementation notes or the manual preview switch.

## Drag-lift exception

Semantic lift is permitted only when an object is actually picked up for dragging. NeoBrutal Commerce does not currently ship a production drag interaction, so `drag-lift` is recorded as an exception law with `productionPattern: false`. Do not invent a hover-lift demo and call it drag behavior.

## Validation

Run:

```bash
npm run check:interactions
npm run check
npm run test:browser
```

`scripts/interactions-check.mjs` validates the v1.3 schema/version, frozen Commerce version boundary, exact interaction token bindings, production evidence markers, tactile hit-target physics, selection semantics, reduced-motion processing behavior, result-state evidence, the drag-lift exception, the exact 4/4 Motion Lab pattern slots, public-lab readiness/browser proof, and the absence of generic upward hover lift or `transition: all`.

`tests/commerce-v13-interactions.spec.mjs` then exercises the public lab across desktop Chromium, mobile Chromium, Firefox, and WebKit with Axe A/AA, pointer/keyboard selection, subscription result state, real reduced-motion emulation, forced-colors proof, overflow checks, and canonical desktop/mobile screenshots.

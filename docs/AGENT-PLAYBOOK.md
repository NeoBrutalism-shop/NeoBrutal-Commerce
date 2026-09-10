# Commerce Agent Playbook

This is the deterministic workflow for an LLM or coding agent implementing NeoBrutal Commerce. `storefront/agents.json` is the machine-readable v1.4 execution and review contract for this workflow.

This v1.4 workflow is **repository-source** guidance. The published npm package remains frozen at Commerce 1.0.0 and intentionally omits the documentation-layer Blocks, Pages, Interactions, and Agent manifests. Use the public repository for these composition and interaction contracts when starting from an installed package.

## Architecture and authority by concern

The composition hierarchy is `Components → Blocks → Pages → Applications`.

Use **Authority by concern** rather than one universal precedence list:

- route path, intent, primary components, route states → `storefront/routes.json`
- Page metadata and Page → Block composition → `storefront/pages.json`
- Block → Component composition and responsive/theme/accessibility expectations → `storefront/blocks.json`
- component models/actions/states/kind/agent rules → `storefront/components.json`
- runtime state meaning and recovery → `storefront/states.json`
- interaction physics and accessible degradation → `storefront/interactions.json`
- normalized models/capabilities → `src/contracts/index.d.ts`
- mutation names/dispatch semantics → `src/actions/runtime.js`

Do not copy one authority's data into another manifest to resolve a disagreement. Resolve the concern at its owner.

## Read before write

1. Read `storefront/agents.json` and preserve its exact workflow/output contract.
2. Identify the target route in `storefront/routes.json`.
3. Resolve the route's component contracts in `storefront/components.json`.
4. Resolve the route-keyed Page in `storefront/pages.json`.
5. Resolve every Page Block in `storefront/blocks.json` and verify each Block component exists in the component registry.
6. Read each component's normalized `models`, `actions`, `states` and `agentRules`.
7. Read `storefront/states.json` before adding loading, error, payment, ownership, subscription, or media states.
8. Confirm model fields/capability flags in `src/contracts/index.d.ts`.
9. Confirm mutation names in `src/actions/runtime.js`.
10. Read `storefront/interactions.json` before adding or changing hover, press, selection, loading, result feedback, reduced-motion, or forced-colors behavior.
11. Read `LLMS.md` for commerce ethics and provider-boundary laws.
12. Read `docs/AI-COMPONENT-NOTES.md` when the target component is high-risk.

## Do not guess

If a requested behavior is not supported by a normalized model, canonical action, capability flag, documented state, Page/Block composition, or interaction pattern, do not manufacture the contract. Either keep the feature out or extend the appropriate authority deliberately with tests and documentation.

Never infer commercial facts. Provider quote/order/invoice output is authoritative for arithmetic. Provider/licensing output is authoritative for ownership and entitlement consequences.

Never infer optional behavior from provider identity. Read normalized capability flags.

## Recipe: build or change a production route

1. Start from route intent, `primaryComponents`, and any route state set in `storefront/routes.json`.
2. Resolve the matching `storefront/pages.json` Page contract.
3. Resolve every referenced `storefront/blocks.json` Block and its component membership.
4. Resolve every involved component's models/actions/states/agent rules in `storefront/components.json`.
5. Confirm normalized model fields and capability flags before binding data.
6. Dispatch canonical actions for mutations.
7. Render canonical state IDs and their recovery obligations without copying route states into Pages.
8. Apply the relevant `storefront/interactions.json` production pattern rather than inventing local physics.
9. Preserve landmarks, heading order, real link/button semantics, visible consequences, and programmatic state.
10. Verify narrow-screen reading order, touch targets, reduced motion, and forced colors.
11. Run the Validation loop.

## Recipe: add a component

1. Define its human purpose and normalized data dependency.
2. Reuse existing models/actions/states whenever possible.
3. Add stable `data-commerce-component` anatomy.
4. Add the component to `storefront/components.json` with at least one explicit agent rule.
5. Add it to `storefront/blocks.json` only where it participates in a reusable composition.
6. Add or update `storefront/pages.json` only when Page composition changes; do not add runtime `states` there.
7. Add it to `storefront/routes.json` only where it is a required primary route surface.
8. Reuse `storefront/interactions.json` interaction patterns; extend that authority deliberately if a genuinely new design-system interaction is required.
9. Add CSS through the core entrypoint and preserve tactile/theme/accessibility laws.
10. Add tests for semantics, state transitions and narrow-screen behavior.

## Recipe: add or change a Block

1. Compose existing registered components before inventing new ones.
2. Define one reusable purpose and keep Block identity stable.
3. Record component membership in `storefront/blocks.json`.
4. State responsive, theme, and accessibility expectations explicitly.
5. Add the Block only to Pages that genuinely use that composition.
6. Keep business/runtime meaning in component/state/action authorities rather than the Block contract.
7. Verify the Block's live explorer surface and responsive behavior.

## Recipe: add or change a Page

1. Match an existing route ID exactly; routes remain authoritative for route intent and route states.
2. Compose only known Block IDs from `storefront/blocks.json`.
3. Keep `storefront/pages.json` free of a `states` field.
4. Preserve every route-required primary component through the resolved composition/application implementation.
5. Use the real production route as the application preview rather than copying production markup into Page Lab.
6. Verify desktop, tablet, mobile, light, and dark inspection paths where applicable.

## Recipe: change an interaction

1. Identify the production pattern in `storefront/interactions.json`.
2. Reuse its selector, token roles, programmatic state, reduced-motion behavior, and forced-colors behavior.
3. Keep motion optional reinforcement; textual/programmatic state remains authoritative.
4. Never add generic upward hover lift. Semantic lift is allowed only for a real picked-up/dragged object.
5. If no production pattern covers the behavior, extend the interaction authority deliberately instead of creating a local taxonomy.
6. Verify keyboard/pointer behavior, reduced motion, forced colors, and multi-engine Browser QA.

## Recipe: wire a provider

1. Keep transport/auth/session logic outside components.
2. Normalize provider responses into Commerce models.
3. Expose capability flags only for operations the adapter can actually perform.
4. Preserve opaque provider IDs only where the normalized contract needs them.
5. Translate provider errors into normalized recoverable failures without discarding user context.
6. Never change a component contract merely to mirror a provider payload.

## Recipe: add an ownership operation

1. Keep order, invoice, license, entitlement, subscription, seat and activation semantics separate.
2. Quote consequence-bearing plan changes before mutation.
3. Preserve paid-term rights when an adapter reports `cancel_at_period_end`.
4. Treat transfer/gift `pending` as an invitation/workflow state, not completed ownership movement.
5. Render audit history only from adapter-returned `OwnershipEventView` records.

## Validation loop

Run both gates:

```bash
npm run check
npm run test:browser
```

A change is not complete if either gate is red. Do not solve failures by removing browsers, disabling Axe rules, widening performance budgets without evidence, or weakening canonical visual checks.

## Agent output contract

When proposing or completing a Commerce change, report the exact v1.4 review fields from `storefront/agents.json`:

- `routesAffected` — production route IDs/paths changed or verified
- `pageContracts` — Page contracts used or changed
- `blockContracts` — Block contracts used or changed
- `componentContracts` — component contracts used or changed
- `normalizedModels` — normalized models used or extended
- `canonicalActions` — canonical actions used or added
- `canonicalStates` — canonical states used or added
- `capabilityGates` — optional capability flags involved
- `interactionPatterns` — v1.3 interaction patterns used or extended
- `accessibility` — keyboard, semantics, focus, reduced-motion, and forced-colors behavior
- `responsiveBehavior` — narrow-screen/layout behavior
- `testsChanged` — conformance/browser/contract tests changed and their results

The short labels `pageContracts`, `blockContracts`, and `interactionPatterns` are intentional machine-review fields, not prose aliases. This output contract makes agent-authored work reviewable by humans and other agents without reverse-engineering implementation details.

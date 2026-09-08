# Commerce Agent Playbook

This is the deterministic workflow for an LLM or coding agent implementing NeoBrutal Commerce.

## Read before write

1. Identify the target route in `storefront/routes.json`.
2. Resolve each route component in `storefront/components.json`.
3. Read the component's normalized `models`, `actions`, `states` and `agentRules`.
4. Confirm model fields/capability flags in `src/contracts/index.d.ts`.
5. Confirm mutation names in `src/actions/runtime.js`.
6. Read `storefront/states.json` before adding loading, error, payment or ownership states.
7. Read `LLMS.md` for commerce ethics and tactile interaction laws.

## Do not guess

If a requested behavior is not supported by a normalized model, canonical action, capability flag or documented state, do not manufacture the contract. Either keep the feature out of the component or extend the normalized contract deliberately with tests and documentation.

Never infer commercial facts. Provider quote/order/invoice output is authoritative for arithmetic. Provider/licensing output is authoritative for ownership and entitlement consequences.

## Recipe: build or change a production route

1. Start from the route intent and `primaryComponents` in `storefront/routes.json`.
2. Preserve landmarks, heading order and real link/button semantics.
3. Bind normalized models to renderer/component anatomy.
4. Dispatch canonical actions for mutations.
5. Render canonical state IDs and their recovery obligations.
6. Apply `data-theme`, semantic tokens and tactile classes without provider-specific branching.
7. Verify narrow-screen reading order and touch targets.
8. Run the Validation loop.

## Recipe: add a component

1. Define its human purpose and normalized data dependency.
2. Reuse existing models/actions/states whenever possible.
3. Add stable `data-commerce-component` anatomy.
4. Add the component to `storefront/components.json` with at least one explicit agent rule.
5. Add it to `storefront/routes.json` only where it is a primary route surface.
6. Add CSS through the core entrypoint and preserve tactile/theme/accessibility laws.
7. Add tests for semantics, state transitions and narrow-screen behavior.

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

When proposing a Commerce change, state:

- route(s) affected
- normalized model(s) used or extended
- canonical action(s) used or added
- canonical state(s) used or added
- capability gate(s), if optional
- accessibility/keyboard behavior
- responsive behavior
- tests changed

This makes agent-authored work reviewable by humans and other agents without reverse-engineering implementation details.

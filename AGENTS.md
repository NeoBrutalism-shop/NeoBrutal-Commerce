# NeoBrutal Commerce — Agent Entry Point

Use this file as the first read for coding agents working in this repository. `storefront/agents.json` is the machine-readable v1.4 execution contract; it coordinates the existing authorities without copying or replacing their domain data.

This v1.4 workflow is **repository-source** guidance. The published npm package remains frozen at Commerce 1.0.0 and intentionally does not ship the v1.1–v1.4 documentation-layer manifests. Agents working from an installed package should use the public repository when they need the Blocks, Pages, Interactions, or Agent contracts.

## Development roadmap authority

Before choosing the next development slice, read `docs/DEVELOPMENT-ROADMAP.md`. It is the canonical product-development sequence and records both the shipped baseline and the target acceptance criteria for v1.0 → v1.5 → v2.0. Do not skip an earlier unfinished milestone merely because a later foundation already exists. Roadmap planning authority is separate from Commerce runtime/domain authority: the roadmap decides **what to build next**, while the machine-readable manifests below decide **how existing Commerce concepts are defined**.

## Architecture and authority by concern

The composition hierarchy is:

`Components → Blocks → Pages → Applications`

**Authority by concern** is the rule. Do not treat one global source-precedence list as correct for every question:

- `storefront/routes.json` owns production route intent, required primary components, and route-level state sets.
- `storefront/pages.json` owns Page metadata and Page → Block composition; it does not own runtime state taxonomy.
- `storefront/blocks.json` owns reusable Block → Component composition plus responsive/theme/accessibility expectations.
- `storefront/components.json` owns component models, canonical actions, canonical states, kind, and `agentRules`.
- `storefront/states.json` owns canonical runtime state meaning and recovery obligations.
- `storefront/interactions.json` owns tactile physics, interaction patterns, token roles, reduced-motion/forced-colors behavior, and explicit exceptions.
- `src/contracts/index.d.ts` owns normalized model and capability boundaries.
- `src/actions/runtime.js` owns canonical mutation names and dispatch semantics.
- `storefront/catalog.json` owns reference product/license/lifecycle content; provider results remain authoritative for real commercial outcomes.

When authorities appear to conflict, resolve the question by its concern instead of copying data into a second source.

## Read before write

After this file, read `storefront/agents.json`, then follow its exact `readOrder`. The human-readable sequence is:

1. `LLMS.md` — non-negotiable commerce ethics, interaction laws, and provider boundaries.
2. `docs/AGENT-PLAYBOOK.md` — deterministic execution workflow and review output contract.
3. `storefront/routes.json` — production route intent, required primary components, and route states.
4. `storefront/components.json` — frozen component → model/action/state/agent guidance.
5. `storefront/blocks.json` — reusable Blocks and their component membership.
6. `storefront/pages.json` — route-keyed Page metadata and Block composition.
7. `storefront/states.json` — canonical runtime state semantics and recovery obligations.
8. `storefront/component-showcase.json` — component presentation, responsive, theme, and accessibility guidance.
9. `storefront/component-states.json` — explicit live examples for stateful component states.
10. `storefront/interactions.json` — v1.3 interaction authority for shipping physics and accessible degradation.
11. `storefront/catalog.json` — reference product/license/lifecycle content.
12. `docs/AI-COMPONENT-NOTES.md` — high-risk component-specific generation notes and traps.

For a route change, do not stop after resolving `primaryComponents`: inspect the Page contract, each referenced Block, and the component contracts underneath them before writing UI.

## Do not guess

- Do not invent a provider-shaped component API when a normalized Commerce model exists.
- Do not invent action names when a canonical Commerce action exists.
- Do not invent state synonyms when `storefront/states.json` already defines one.
- Do not copy route state arrays into `storefront/pages.json`.
- Do not create a second interaction taxonomy outside `storefront/interactions.json`.
- Do not fabricate reviews, guarantees, invoices, ownership history, pricing, tax, license scope or entitlement outcomes.
- Do not infer capability from a provider name. Read normalized capability flags.

## Architecture boundary

Read:

`provider → adapter/normalizer → normalized Commerce model → renderer → HTML / React`

Write:

`UI / agent → canonical Commerce action → normalized runtime → adapter → provider`

Raw EDD, WordPress, gateway, database-row or licensing-provider objects stop at the adapter boundary.

## UI laws

- Hover compresses raised controls toward their shadow; controls never float upward.
- Press fully seats a tactile control.
- Selection stays visibly and programmatically latched instead of floating.
- Motion communicates cause, state, and result; it never carries meaning by itself.
- Use semantic tokens and `data-theme="light|dark"`.
- Prefer fluid `clamp()` scaling over breakpoint piles.
- Keyboard, focus, reduced motion and forced colors are release requirements.
- Price, renewal, license scope and consequences remain visible before purchase.

## Agent review output

Before calling agent-authored work complete, report the v1.4 review fields from `storefront/agents.json`: routes affected, Page contracts, Block contracts, component contracts, normalized models, canonical actions/states, capability gates, interaction patterns, accessibility, responsive behavior, and tests changed.

## Validation loop

Before considering a change complete, run:

```bash
npm run check
npm run test:browser
```

Browser QA is intentionally multi-engine. Do not remove Chromium, mobile Chromium, Firefox or WebKit coverage to make a change pass.

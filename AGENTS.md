# NeoBrutal Commerce — Agent Entry Point

Use this file as the first read for coding agents working in this repository.

## Read before write

Read these sources in order before generating or changing Commerce UI:

1. `LLMS.md` — non-negotiable interaction, commerce-ethics and provider-boundary laws.
2. `storefront/routes.json` — production route intent and the primary components expected on each route.
3. `storefront/components.json` — machine-readable component → model/action/state guidance.
4. `storefront/states.json` — canonical state taxonomy and recovery obligations.
5. `src/contracts/index.d.ts` — normalized models and capability contracts.
6. `src/actions/runtime.js` — canonical command names and dispatch semantics.
7. `docs/AGENT-PLAYBOOK.md` — deterministic implementation workflow.
8. `docs/AI-COMPONENT-NOTES.md` — component-specific generation notes and traps.

## Do not guess

- Do not invent a provider-shaped component API when a normalized Commerce model exists.
- Do not invent action names when a canonical Commerce action exists.
- Do not invent state synonyms when `storefront/states.json` already defines one.
- Do not fabricate reviews, guarantees, invoices, ownership history, pricing, tax, license scope or entitlement outcomes.
- Do not infer capability from a provider name. Read adapter capability flags.

## Architecture boundary

Read:

`provider → adapter/normalizer → normalized Commerce model → renderer → HTML / React`

Write:

`UI / agent → canonical Commerce action → normalized runtime → adapter → provider`

Raw EDD, WordPress, gateway, database-row or licensing-provider objects stop at the adapter boundary.

## UI laws

- Hover compresses raised controls toward their shadow; controls never float upward.
- Press fully seats a tactile control.
- Use semantic tokens and `data-theme="light|dark"`.
- Prefer fluid `clamp()` scaling over breakpoint piles.
- Keyboard, focus, reduced motion and forced colors are release requirements.
- Price, renewal, license scope and consequences remain visible before purchase.

## Validation loop

Before considering a change complete, run:

```bash
npm run check
npm run test:browser
```

Browser QA is intentionally multi-engine. Do not remove Chromium, mobile Chromium, Firefox or WebKit coverage to make a change pass.

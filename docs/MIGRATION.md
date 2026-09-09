# Commerce Migration Guide — v0.9 RC

## v0.9.0-rc.1 → v1.0.0

There is no intentional breaking public API change between the reviewed RC and v1.0. Package/runtime/type/manifest identity moves to `1.0.0`; the npm package becomes public and uses `PolyForm-Noncommercial-1.0.0`. Existing provider adapters and normalized model/action/state identifiers remain frozen.

For package consumers, install `@neobrutal/commerce@1.0.0` and review `LICENSE.md` before commercial use. The v0.9 visual baseline remains historical; v1.0 has its own canonical visual lock.


Use this guide when moving an integration forward without breaking the normalized Commerce boundary.

## Upgrade order

1. Read the new package version and `README.md` status.
2. Run `npm run check` before changing application code.
3. Compare `src/contracts/index.d.ts` and `src/actions/index.d.ts` with your integration.
4. Compare `storefront/states.json` and `storefront/components.json` with any locally copied UI.
5. Update adapters before renderers if provider shapes changed.
6. Update renderer/action bindings after normalized models/actions are aligned.
7. Run `npm run test:browser` after application-facing changes.

Provider payloads are not a migration source of truth. Normalize them to the current Commerce contract.

## v0.5 → v0.6

v0.6 expanded ownership lifecycle concepts without collapsing them into transaction state.

Important additions include:

- `InvoiceView`
- `SubscriptionView`
- `PlanChangeQuoteView`
- `OwnershipTransferView`
- `OwnershipEventView`
- plan-change, transfer and ownership-history licensing capabilities
- invoice/subscription transaction capabilities
- ownership lifecycle actions and renderers

If your integration only used the v0.5 purchase/cart/order path, those paths remain valid. Add optional lifecycle methods only when the provider actually supports them.

## v0.6 → v0.7

v0.7 is a quality-hardening release rather than a normalized API redesign.

Adopters should expect stricter validation:

- WCAG A/AA Axe checks including color contrast
- Chromium/mobile Chromium/Firefox/WebKit coverage
- reduced-motion and forced-colors behavior
- 320–1440px responsive checks
- CLS/static payload budgets
- canonical visual fingerprints

If an old integration fails v0.7, fix accessibility, layout, browser or resilience behavior rather than bypassing the gate.

## v0.7 → v0.8

v0.8 adds an adoption/documentation contract around the existing runtime.

New adoption surfaces include:

- `AGENTS.md`
- `docs/ADOPTION.md`
- `docs/AGENT-PLAYBOOK.md`
- `docs/AI-COMPONENT-NOTES.md`
- `docs/RECIPES.md`
- `docs/THEMING.md`
- `docs/PROVIDER-EXAMPLES.md`
- `storefront/components.json`
- documentation conformance through `npm run check`

The main migration task is removing undocumented local assumptions. Route components, states, actions and model meaning should resolve through the machine-readable manifests and normalized declarations.

## v0.8 → v0.9

v0.9 is a release-candidate freeze, not a new feature architecture. There are no intentional breaking changes to normalized models, adapter boundaries, renderer APIs, canonical actions, component IDs or state taxonomy from stable v0.8.

Adopters should:

- move package/runtime/types/manifests together to `0.9.0-rc.1`;
- compare against `tests/public-api-v09.json` before changing any public identifier;
- preserve the provider → adapter → normalized model → renderer read path;
- preserve the UI/agent → canonical action → normalized runtime → adapter write path;
- run the connected production storefront stress in addition to existing route/browser coverage;
- treat the v0.8 visual fingerprint file as historical provenance and use the reviewed v0.9 RC visual lock for current pixels.

A failure against the freeze is a release-blocking contract decision, not permission to rename the API casually.

## Copied component migration

If you copied Commerce markup/CSS into another project:

- retain stable `data-commerce-component` attributes;
- compare your component against `storefront/components.json`;
- keep canonical state IDs instead of local synonyms;
- keep actions routed through `createActionDispatcher()` or action bindings;
- replace raw provider props with normalized model props;
- preserve light/dark, focus, reduced-motion and forced-colors behavior.

A visual fork is allowed. A semantic/provider fork is not.

## Adapter migration

### Transaction side

`CommerceAdapter` owns product/cart/quote/order data plus capability-gated transaction features such as refunds, invoices and subscriptions.

When changing an EDD/transaction integration:

- keep transport/auth/session code in the injected transport;
- map provider statuses deliberately;
- use provider-returned quote/order totals as authoritative;
- never move provider-native records into components.

### Licensing side

`LicensingAdapter` owns licenses, entitlements and optional activation/seat/renewal/download/lifecycle capabilities.

When changing licensing providers:

- replace bridge methods and normalizers;
- keep the same normalized `LicenseView`/entitlement/lifecycle outputs;
- expose capability flags only for methods the bridge implements;
- do not rename Commerce actions to match the provider API.

## State migration

Canonical state IDs live in `storefront/states.json`. If your application currently uses alternate strings, normalize them in the adapter or application boundary before rendering.

Do not map distinct concepts onto the same state merely because a provider does so internally. Examples:

- `cancel_at_period_end` is not `cancelled`;
- checkout `failed` is not ownership `expired`;
- a pending transfer is not completed ownership movement.

## Pre-release checklist

- no raw provider object crosses the component boundary
- no provider-specific command replaces a canonical Commerce action
- every production route primary component resolves in `storefront/components.json`
- copied UI preserves semantic anatomy and state IDs
- custom themes pass strict accessibility
- `npm run check` is green
- `npm run test:browser` is green

For concrete integrations, see `docs/RECIPES.md` and `docs/PROVIDER-EXAMPLES.md`.

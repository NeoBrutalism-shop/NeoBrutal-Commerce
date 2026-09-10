# v1.0 Public Release Contract

NeoBrutal Commerce v1.0.0 is the first public package release. It promotes the release-candidate contract without adding a new commerce architecture layer.

## Public package

- npm package: `@neobrutal/commerce`
- exact version: `1.0.0`
- package is public (`private: false`)
- package contents are allowlisted through `package.json#files`
- tests, demos, route shells and CI internals are not shipped in the npm tarball
- package exports remain frozen from the reviewed v0.9 RC contract

## License

The public package uses the SPDX identifier `PolyForm-Noncommercial-1.0.0`. The canonical terms are linked from `LICENSE.md` together with the required copyright notice. Commercial use is not granted by the public package license and requires a separate written commercial license.

## Supply-chain release

`.github/workflows/release.yml` publishes only from a GitHub Release, verifies that the release tag exactly matches `v1.0.0`, runs the complete quality and browser gates, and uses npm trusted publishing through GitHub OIDC. No long-lived npm publish token is embedded in the workflow.

npm trusted publishing must be configured for this repository and the exact workflow filename before the first registry publish. The expected trusted-publisher identity is:

- GitHub organization: `NeoBrutalism-shop`
- repository: `NeoBrutal-Commerce`
- workflow: `release.yml`

## Production activation boundary

Publishing a GitHub Release is the production activation event for npm publication. The workflow intentionally has no push, pull-request, schedule or manual-dispatch publish trigger. A Release should therefore never be published merely to test the pipeline.

The release workflow keeps the activation boundary narrow:

- trigger: `release` with `types: [published]` only
- repository permission: `contents: read`
- npm trusted-publishing permission: `id-token: write`
- release tag guard: `GITHUB_REF_NAME` must equal `v` + `package.json#version`
- dependency install: exact lockfile install with scripts/audit/funding disabled
- publication gate order: release tag → quality/package gates → four-engine Browser QA → npm publish
- authentication: OIDC trusted publishing only; no `NPM_TOKEN`, `NODE_AUTH_TOKEN` or repository secret is accepted by the release contract

A draft GitHub Release does not satisfy the `published` event. Publishing the draft does, so the publish action itself must be treated as irreversible production intent.

## Safe preflight

Before publishing the first `v1.0.0` GitHub Release:

1. Verify the npm trusted-publisher configuration outside this repository matches `NeoBrutalism-shop / NeoBrutal-Commerce / release.yml` exactly.
2. Confirm the intended release commit is the reviewed `main` commit and that current Quality, Browser QA and package gates are green on that exact SHA.
3. Run `npm run check:release`; this statically verifies the frozen API plus the release-only trigger, exact OIDC permission boundary, tag guard, ordered gates and tokenless publish command.
4. Run `npm pack --dry-run --json` and inspect the allowlisted package contents.
5. Use the normal pull-request CI path for preflight changes. Do not add a temporary publish trigger and do not publish/unpublish a GitHub Release as a dry run.
6. Only after the external trusted-publisher identity is confirmed should the exact `v1.0.0` Release be published.

Repository CI can prove the repository-side contract, but it cannot prove the npm account-side trusted-publisher configuration. That external configuration remains a genuine human-controlled prerequisite.

## v1 API freeze

`tests/public-api-v10.json` freezes the exact public contract that survived v0.9 RC: package exports, canonical actions, state IDs, route IDs, component IDs, semantic tokens, license plan IDs and normalized TypeScript model markers.

## Visual freeze

The reviewed v1.0 Linux visual baseline is locked in `tests/visual-baselines-v10.json` for home, product, checkout, account and ownership across desktop Chromium and mobile Chromium. Its exact dimensions and SHA-256 fingerprints come from successful Browser QA run `34304046291` on source head `b48ee9491999ce1c998314f7b709ccfe1a1becd4`, artifact `10086065314`. Firefox and WebKit remain behavioral/accessibility engines rather than byte-level pixel surfaces.

`tests/commerce-v10-visual.spec.mjs` enforces those reviewed dimensions and fingerprints so future pixel drift fails the release gate instead of silently replacing the baseline.

## Release gates

1. `npm run check` passes, including package tarball inspection and the v1 API freeze.
2. `npm run check:release` proves the release-only trigger, exact OIDC permissions, dynamic version/tag guard, ordered quality/browser gates and tokenless trusted-publishing command.
3. Browser QA passes on Chromium, mobile Chromium, Firefox and WebKit.
4. The reviewed v1 canonical Linux visual fingerprints pass exactly against `tests/visual-baselines-v10.json`.
5. `npm pack --dry-run --json` contains only the intended public package surface.
6. Package/runtime/types/manifests and visible storefront chrome all agree on `1.0.0` / `COMMERCE v1.0`.
7. The npm trusted-publisher identity is externally verified for this repository and `release.yml`.
8. The GitHub Release tag must be exactly `v1.0.0` before registry publication.

## Post-v1 compatibility

Breaking a frozen v1 identifier requires a major-version migration. Provider-native payloads remain outside the public Commerce API.

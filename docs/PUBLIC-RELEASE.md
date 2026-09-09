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

## v1 API freeze

`tests/public-api-v10.json` freezes the exact public contract that survived v0.9 RC: package exports, canonical actions, state IDs, route IDs, component IDs, semantic tokens, license plan IDs and normalized TypeScript model markers.

## Release gates

1. `npm run check` passes, including package tarball inspection and the v1 API freeze.
2. Browser QA passes on Chromium, mobile Chromium, Firefox and WebKit.
3. The v1 canonical Linux visual surfaces are reviewed and fingerprint-locked.
4. `npm pack --dry-run --json` contains only the intended public package surface.
5. Package/runtime/types/manifests and visible storefront chrome all agree on `1.0.0` / `COMMERCE v1.0`.
6. The GitHub Release tag must be exactly `v1.0.0` before registry publication.

## Post-v1 compatibility

Breaking a frozen v1 identifier requires a major-version migration. Provider-native payloads remain outside the public Commerce API.

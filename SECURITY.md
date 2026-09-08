# Security Policy

NeoBrutal Commerce is a UI/runtime contract for digital-product commerce. It deliberately does not store payment credentials, provider secrets or raw licensing-provider credentials in the core package.

## Reporting a vulnerability

Do not publish secrets, exploit payloads, customer data or active vulnerability details in a public issue.

Use GitHub private vulnerability reporting for this repository when it is available. If private reporting is unavailable, contact the repository maintainers through the NeoBrutalism-shop GitHub organization before disclosing technical details publicly.

Include:

- affected version or commit
- affected route/package export
- reproduction steps
- expected and observed behavior
- impact assessment
- whether credentials, payment state, entitlement state or signed-download URLs are involved

## Security boundaries

Commerce expects hosts/providers to own:

- authentication and authorization
- payment tokenization and gateway secrets
- tax/provider credentials
- customer PII persistence
- license-key issuance and secret storage
- signed-download signing and expiry enforcement
- webhook verification and replay protection

Commerce owns normalized UI/runtime semantics around those capabilities. Do not move provider secrets into renderer props, DOM data attributes, demo fixtures, logs or machine-readable storefront manifests.

## Pre-v1 distribution

The package remains `private` and `UNLICENSED` through the v0.9 release-candidate phase to prevent accidental public npm publication or an unintended licensing grant. The public/commercial packaging decision is a v1.0 release gate.

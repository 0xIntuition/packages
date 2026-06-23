# Source Reconciliation

This workspace is the public package workspace for the `@0xintuition/*`
package artifacts.

Reconciliation decisions for this alpha package repo:

- Package sources in this repository are the public package sources.
- Deployment extraction and publish metadata changes happen in this public package workspace.
- Predicate specs live in one source module per predicate under `packages/predicates/src/generated/specs/`; `generated/index.ts` and standalone public modules are generated from those source modules.
- Classification specs live in one source module per classification and are exposed as direct package subpaths; generated Creation Profiles compose those specs with schema provenance, metadata predicate matrix rows, and predicate IDs/labels for known frontend creation flows; `@0xintuition/primitives` stays grouped by builder domain rather than duplicating catalog entries.
- The self-hosted JSON-LD contexts in `ids` and the Ethereum classification specs are identity-sensitive. Do not change those URLs or serialized atom-data shapes without an explicit release/identity review.
- Detailed provenance is maintained outside public repository docs.

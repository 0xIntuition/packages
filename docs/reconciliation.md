# Source Reconciliation

This workspace is a duplicate-only staging area for public package publication.

Reconciliation decision for this alpha package repo:

- Publishable package directories were copied into this repository rather than consumed from the product codebase.
- Deployment extraction and publish metadata changes happen only in this copy.
- Predicate specs live in one source module per predicate under `packages/predicates/src/generated/specs/`; `generated/index.ts` and standalone public modules are generated from those source modules.
- Classification specs live in one source module per classification and are exposed as direct package subpaths; `@0xintuition/primitives` stays grouped by builder domain rather than duplicating catalog entries.
- Detailed provenance is maintained outside public repository docs.

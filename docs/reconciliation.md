# Source Reconciliation

This workspace is a duplicate-only staging area for public package publication.

Reconciliation decision for this alpha package repo:

- Publishable package directories were copied into this repository rather than consumed from the product codebase.
- Deployment extraction and publish metadata changes happen only in this copy.
- Predicate standalone modules are generated from the canonical predicate catalog so the catalog remains the source of truth.
- Detailed provenance is maintained outside public repository docs.

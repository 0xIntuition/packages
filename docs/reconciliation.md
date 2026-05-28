# Source Reconciliation

This workspace was scaffolded from a read-only copy of `intuition-v2/intuition`.

- Base local `main`: `98875205acd490b3904e8cc9921a47d364a5ccc2`
- PR #453 predicate catalog cleanup branch: `jp/eng-10640-clean-up-predicate-catalog-remove-is-de-dupe` at `d35e99e24a7ca83e07b0fa5d2a00c64e5e99dc6a`
- PR #653 release tooling branch: `codex/publishable-predicates-ids` at `f97e01d7bc94d78ae351dd9aa186aea91db6ecf0`

Reconciliation decision for this alpha package repo:

- All publishable package directories were copied from the PR #653 checkout so staged release tooling and ids/predicates package metadata are present.
- Predicate catalog source files and README were then overlaid from PR #453 so the new repo includes the intended predicate cleanup.
- No files were removed or edited in `intuition-v2`; deployment extraction and publish metadata changes happen only in this copy.
- Predicate file splitting remains deferred generator/design work. The generated catalog output is not hand-split in this scaffold.

# Intuition Packages

Public alpha package workspace for Intuition protocol libraries.

This repository is prepared from a reconciled copy of `intuition-v2/intuition` plus the relevant package-publication changes from PR #453 and PR #653. It is intentionally copy-only for this round; `intuition-v2` remains the active product source until a later migration consumes the published packages.

## Packages

- `@0xintuition/deployments`
- `@0xintuition/curves`
- `@0xintuition/ids`
- `@0xintuition/classifications`
- `@0xintuition/predicates`
- `@0xintuition/primitives`
- `@0xintuition/protocol`
- `@0xintuition/periphery`
- `@0xintuition/react`

## Validation

```bash
bun install --frozen-lockfile
bun run build
bun run typecheck
bun run test
bun run schema:validate
bun run pack:dry-run
bun run smoke:tarballs
```

Publication is blocked on internal review, schema host verification, and the documented release order. Do not publish directly from package roots; use staged release tarballs after review.

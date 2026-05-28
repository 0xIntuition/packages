# Intuition Packages

Public alpha package workspace for Intuition protocol libraries.

This repository is a duplicate-only publication staging area for public package artifacts. The product codebase remains the migration source until consumers are intentionally moved onto the published packages.

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
bun run check
bun run schema:validate
bun run guard:supply-chain
bun run pack:dry-run
bun run smoke:tarballs
```

Publication is blocked on release review, schema host verification, and the documented release order. Do not publish directly from package roots; use staged release tarballs after review.

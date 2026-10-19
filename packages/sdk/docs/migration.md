# `@0xintuition/sdk` v1 Import Guidance

## Goal

Make the SDK-owned surface the default import path for external consumers without breaking existing code that still reaches protocol exports through the root package.

## Recommended Imports

Prefer these entrypoints for new work:

- `@0xintuition/sdk`
  - common SDK-first actions, utilities, and selected shared types
- `@0xintuition/sdk/api`
  - backend reads such as `createIntuitionApiClient`, `atoms.getById`, and `triples.getById`
- `@0xintuition/sdk/actions`
  - explicit onchain planning helpers
- `@0xintuition/sdk/utils`
  - deterministic ID and formatting helpers
- `@0xintuition/predicates`
  - canonical predicate registry, inline/IPFS atom-data helpers, and launch constants
- `@0xintuition/sdk/protocol`
  - low-level escape hatch when you truly need direct protocol exports

## Compatibility Rule

`@0xintuition/sdk` still re-exports `@0xintuition/protocol` from the package root. Treat that as a compatibility bridge, not the preferred long-term public contract. When you need direct protocol access, prefer the explicit `@0xintuition/sdk/protocol` subpath.

Implications:

- Existing callers do not need an immediate breaking migration.
- New external docs and examples should point at SDK-owned subpaths first.
- Future narrowing of the root export surface should be additive or staged behind a release note.

## Migration Patterns

### Backend reads

```ts
import { createIntuitionApiClient, getIntuitionApiUrl } from '@0xintuition/sdk/api'

const api = createIntuitionApiClient({
  baseUrl: getIntuitionApiUrl('mainnet'),
})
```

### Action planning

Before:

```ts
import { multivaultPrepareDepositTx } from '@0xintuition/sdk'
```

After:

```ts
import { multivaultPrepareDepositTx } from '@0xintuition/sdk/actions'
```

### Deterministic helpers

Before:

```ts
import { calculateAtomId, PREDICATES } from '@0xintuition/sdk'
```

After:

```ts
import { FOLLOW, PREDICATE_IDS } from '@0xintuition/predicates'
import { calculateAtomId } from '@0xintuition/sdk/utils'
```

### Low-level protocol escape hatch

Before:

```ts
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk'
```

After:

```ts
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk/protocol'
```

## Release Guidance

For the v1 line:

- Keep the root export surface working for compatibility.
- Prefer subpath examples in docs, snippets, and release notes.
- Prefer `@0xintuition/sdk/protocol` over the root package for low-level protocol access.
- Treat any future removal of protocol-wide root exports as a separately announced change.

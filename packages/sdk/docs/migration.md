# `@0xintuition/sdk` 4.0.0 Migration

## Goal

Version 4.0.0 narrows the root to SDK actions, API reads, wallet and bridge workflows, formatting, and selected shared exports. Protocol-wide and ID-wide root re-exports have been removed.

## Recommended Imports

Prefer these entrypoints for new work:

- `@0xintuition/sdk`
  - common SDK-first actions, utilities, and selected shared types
- `@0xintuition/sdk/api`
  - backend reads such as `createIntuitionApiClient`, `atoms.getById`, and `triples.getById`
- `@0xintuition/sdk/actions`
  - explicit onchain planning helpers
- `@0xintuition/sdk/utils`
  - formatting helpers (import deterministic IDs from `@0xintuition/ids`)
- `@0xintuition/predicates`
  - canonical predicate registry, inline/IPFS atom-data helpers, and launch constants
- `@0xintuition/sdk/protocol`
  - low-level escape hatch when you truly need direct protocol exports

## Root export changes

Import low-level wrappers, ABI values, network helpers, and protocol types from
`@0xintuition/protocol` or `@0xintuition/sdk/protocol`. The latter is the explicit
escape hatch and remains supported. Import other deterministic ID utilities from
`@0xintuition/ids`.

The only selected shared root exports are `calculateAtomId`, `calculateTripleId`,
`calculateCounterTripleId`, `calculateOAuthAtomId`, the types `AtomId`, `TripleId`,
`CounterTripleId`, `OAuthAtomInput`, `ReadConfig`, and `WriteConfig`. These support
SDK wallet and action inputs (actions take atom and triple ids). All SDK-owned modules
remain available at the root and their documented subpaths. Pure action envelope
builders now live in SDK actions; see [the CLI alias mapping](./action-plans.md).

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
import { calculateAtomId } from '@0xintuition/sdk'
```

After:

```ts
import { PREDICATE_IDS } from '@0xintuition/predicates'
import { follow } from '@0xintuition/predicates/follow'
import { calculateAtomId } from '@0xintuition/ids'
```

### Low-level protocol escape hatch

Previously, callers imported `getMultiVaultAddressFromChainId` from the SDK root.
That import is removed in 4.0.0.

After:

```ts
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk/protocol'
```

## Release Guidance

Use the explicit `sdk/protocol` subpath for the full low-level protocol API.
Update imports before upgrading to 4.0.0. Bytecode is available from
`@0xintuition/deployments/bytecode` or `@0xintuition/protocol/contracts`, and curve
math from `@0xintuition/curves`.

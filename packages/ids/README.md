# @0xintuition/ids

Deterministic content-addressable ID utilities for Intuition atoms, triples, counter-triples, OAuth atoms, and canonical predicate atom data.

Alpha status: published under the alpha dist-tag. OAuth atom helpers use the identity-sensitive schema context at https://schema.intuition.systems/v1/oauth-atom.jsonld.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/ids@alpha viem
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Example

```ts
import { calculateAtomId, calculatePredicateId, createPredicateAtomData } from '@0xintuition/ids'

const atomId = calculateAtomId('hello intuition')

const followAtomData = createPredicateAtomData(
  'follow',
  'Directional subscription or tracking of the object entity'
)

const followPredicateId = calculatePredicateId(
  'follow',
  'Directional subscription or tracking of the object entity'
)
```

## OAuth Atom Context

`OAUTH_ATOM_CONTEXT` is locked to `https://schema.intuition.systems/v1/oauth-atom.jsonld`. Serialized JSON and derived atom ID vectors are covered by tests because changes alter on-chain atom identity.

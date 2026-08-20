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
import { calculateAtomId } from '@0xintuition/ids'

const atomId = calculateAtomId('hello intuition')
```

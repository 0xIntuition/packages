# @0xintuition/primitives

High-level atom, claim, predicate, classification, and validation helpers for building with Intuition off-chain data.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/primitives@alpha
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Usage

```ts
import { buildEthereumAccount } from '@0xintuition/primitives/atom'
import { buildTripleByName } from '@0xintuition/primitives/triple'

const account = buildEthereumAccount({
  address: '0x0000000000000000000000000000000000000001',
})
if (!account.success) throw new Error(account.errors.join(', '))

const claim = buildTripleByName(account.value.id, 'follow', account.value.id)
if (!claim.success) throw new Error(claim.errors.join(', '))
```

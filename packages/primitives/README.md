# @0xintuition/primitives

High-level atom, claim, predicate, classification, and validation helpers for building with Intuition off-chain data.

## Install

```bash
bun add @0xintuition/primitives@alpha
```

## Usage

```ts
import { buildEthereumAccount, buildTripleByName } from '@0xintuition/primitives'

const account = buildEthereumAccount({
  address: '0x0000000000000000000000000000000000000001',
})
if (!account.success) throw new Error(account.errors.join(', '))

const claim = buildTripleByName(account.value.id, 'follow', account.value.id)
if (!claim.success) throw new Error(claim.errors.join(', '))
```

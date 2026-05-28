# @0xintuition/classifications

Canonical classification specs and JSON-LD atom data builders for Intuition alpha packages.

## Install

```bash
bun add @0xintuition/classifications@alpha
```

## Usage

```ts
import { buildAtomData, getClassification } from '@0xintuition/classifications'

const spec = getClassification('ethereum-account')
const atomData = buildAtomData('ethereum-account', {
  address: '0x0000000000000000000000000000000000000001',
})
```

Ethereum classifications use the immutable `https://schema.intuition.systems/v1/ethereum.jsonld` JSON-LD context and are gated on `schema.intuition.systems` resolving before publication.

# @0xintuition/deployments

Typed Intuition chain metadata, deployment addresses, and lookup helpers.

## Install

```bash
bun add @0xintuition/deployments@alpha
```

## Usage

```ts
import {
  getMultiVaultAddressFromChainId,
  intuitionMainnet,
} from '@0xintuition/deployments'

const multiVault = getMultiVaultAddressFromChainId(intuitionMainnet.id)
```

This package owns protocol deployment addresses. Periphery-specific bridge/router deployments remain in `@0xintuition/periphery` because those addresses are tied to periphery helper surfaces rather than core protocol contract ABIs.

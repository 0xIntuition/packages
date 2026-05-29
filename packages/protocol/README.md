# @0xintuition/protocol

Core Intuition protocol contract ABIs, event parsers, and interaction helpers for MultiVault, Trust, TrustBonding, WrappedTrust, and emissions controllers.

Versioned as `3.0.0` and published on the `latest` dist-tag. The major bump (vs the legacy `2.x` line) reflects deployment addresses and chain metadata being extracted into `@0xintuition/deployments`.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/protocol @0xintuition/curves@alpha viem
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Usage

```ts
import { MultiVaultAbi, multiVaultGetAtomCost } from '@0xintuition/protocol'
import { getMultiVaultAddressFromChainId, intuitionMainnet } from '@0xintuition/deployments'
import { createPublicClient, http } from 'viem'

const publicClient = createPublicClient({
  chain: intuitionMainnet,
  transport: http(),
})

const address = getMultiVaultAddressFromChainId(intuitionMainnet.id)
const atomCost = await multiVaultGetAtomCost({ address, publicClient })
```

## Package Boundary

`@0xintuition/protocol` does not export deployment addresses, chain definitions, or address lookup helpers in this alpha. Use `@0xintuition/deployments` for core protocol deployments and `@0xintuition/periphery` for periphery bridge/router deployments.

The package depends on `@0xintuition/curves` for deprecated compatibility re-exports of curve helpers. New consumers should import curve math from `@0xintuition/curves` directly.

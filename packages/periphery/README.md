# @0xintuition/periphery

TypeScript helpers for Intuition periphery contracts, currently focused on `TrustSwapAndBridgeRouter` and direct meta-bridge wrappers.

Alpha status: published under the alpha dist-tag. Periphery bridge/router addresses stay in this package; shared Intuition chain IDs come from `@0xintuition/deployments`.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/periphery@alpha @0xintuition/deployments@alpha viem
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Scope

- Deployment helpers for published Intuition periphery contracts.
- Calldata encoders and client wrappers for `TrustSwapAndBridgeRouter`.
- Direct bridge helpers for `MetaERC20Hub`, `MetaERC20Spoke`, and `MetaNativeSpoke`.
- Base bridge asset address helpers for `USDC` and `WETH` approval flows.

Current deployments are mainnet-oriented:

- Base mainnet for `TrustSwapAndBridgeRouter` and `MetaERC20Hub`.
- Intuition mainnet for `MetaERC20Spoke` and `MetaNativeSpoke`.
- Base mainnet bridge asset addresses for `USDC` and `WETH`.

## Usage

```ts
import { getTrustSwapAndBridgeRouterAddressFromChainId } from '@0xintuition/periphery'
import { base } from 'viem/chains'

const routerAddress = getTrustSwapAndBridgeRouterAddressFromChainId(base.id)
```

`WrappedTrust`, `MultiVault`, and other core protocol deployment addresses resolve from `@0xintuition/deployments`, not this package.

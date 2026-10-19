# @0xintuition/periphery

TypeScript helpers for Intuition periphery contracts, including `FeeProxy`, `TrustSwapAndBridgeRouter`, and direct meta-bridge wrappers.

Alpha status: published under the alpha dist-tag. Periphery bridge/router addresses stay in this package; shared Intuition chain IDs come from `@0xintuition/deployments`.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/periphery@alpha @0xintuition/deployments@alpha viem
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Scope

- Deployment helpers for published Intuition periphery contracts.
- FeeProxy artifacts, URI-aware atom creation encoders and client wrappers, affiliate registration and fee reads, and refund helpers.
- Calldata encoders and client wrappers for `TrustSwapAndBridgeRouter`.
- Direct bridge helpers for `MetaERC20Hub`, `MetaERC20Spoke`, and `MetaNativeSpoke`.
- Base bridge asset address helpers for `USDC` and `WETH` approval flows.

Current deployments are mainnet-oriented:

- Base mainnet for `TrustSwapAndBridgeRouter` and `MetaERC20Hub`.
- Intuition mainnet for `MetaERC20Spoke` and `MetaNativeSpoke`.
- Base mainnet bridge asset addresses for `USDC` and `WETH`.

Bridge helpers cover router-based TRUST transfers from Base to Intuition, direct TRUST transfers from Intuition to Base, and direct USDC and WETH transfers in both directions. No periphery testnet deployments are included.

The FeeProxy deployment map is empty. `getFeeProxyAddressFromChainId` throws until an address is published; FeeProxy wrappers accept an explicit contract address.

## Usage

```ts
import { getTrustSwapAndBridgeRouterAddressFromChainId } from '@0xintuition/periphery'
import { base } from 'viem/chains'

const routerAddress = getTrustSwapAndBridgeRouterAddressFromChainId(base.id)
```

Generate deterministic calldata for a bridge call:

```ts
import { trustSwapAndBridgeRouterBridgeTrustEncode } from '@0xintuition/periphery'

const calldata = trustSwapAndBridgeRouterBridgeTrustEncode(
	1_000n,
	'0x2222222222222222222222222222222222222222'
)
```

Router swap encoders and client wrappers require a `deadline` Unix timestamp. `trustSwapAndBridgeRouterQuoteExactInput` returns `[amountOut, success]`; check `success` and abort the swap when it is `false` before deriving a minimum output.

`feeProxyCreateAtomsWithUrisViaEncode` encodes the affiliate, atom data, gross assets, URI lists, and a `FeeGuard` with `maxFeeBps` and `maxFixedFee`. `feeProxyCreateAtomsWithUrisVia` simulates and submits that call with the gross transaction value. Use `feeProxyPreviewCreationFee` to read the fee and forwarded amount, and `feeProxyPendingRefund` / `feeProxyClaimRefund` for pull-fallback refunds.

`WrappedTrust`, `MultiVault`, and other core protocol deployment addresses resolve from `@0xintuition/deployments`, not this package.

`@0xintuition/protocol` provides core contract helpers; router, bridge, meta-bridge, and FeeProxy helpers belong to `@0xintuition/periphery`.

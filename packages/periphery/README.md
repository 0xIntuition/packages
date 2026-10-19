# @0xintuition/periphery

TypeScript helpers for Intuition periphery contracts, currently focused on `TrustSwapAndBridgeRouter` and the direct meta-bridge wrappers.

Periphery ABIs, bytecode and deployment addresses are defined in `@0xintuition/deployments` and re-exported here.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
npm install viem @0xintuition/periphery@alpha
```

**Peer Dependencies:** `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Scope

- deployment helpers for published Intuition periphery contracts
- calldata encoders and client-based wrappers for `TrustSwapAndBridgeRouter`
- direct bridge helpers for `MetaERC20Hub`, `MetaERC20Spoke`, and `MetaNativeSpoke`
- Base bridge asset address helpers for `USDC` and `WETH` approval flows
- calldata encoders and client wrappers for `FeeProxy`; `getFeeProxyAddressFromChainId` resolves the Intuition Testnet (`13579`) FeeProxy and throws for Intuition mainnet until FeeProxy is deployed there

Current deployments are mainnet-oriented:

- Base mainnet for `MetaERC20Hub`
- Intuition mainnet for `MetaERC20Spoke` and `MetaNativeSpoke`
- Base mainnet bridge asset addresses for `USDC` and `WETH`
- `TrustSwapAndBridgeRouter`: pending redeployment on Base mainnet. The router deployed there predates the `deadline` parameter this package's ABI carries, so no address is published until the new deployment exists, and `getTrustSwapAndBridgeRouterAddressFromChainId(base.id)` throws until then.

That means the package now covers:

- router-based TRUST bridge flows from Base to Intuition
- direct TRUST bridge flows from Intuition to Base
- direct USDC and WETH bridge flows between Base and Intuition in both directions

`WrappedTrust` is a core contract and resolves from `@0xintuition/protocol`, not from `@0xintuition/periphery`.

Bridge helpers cover router-based TRUST transfers from Base to Intuition, direct TRUST transfers from Intuition to Base, and direct USDC and WETH transfers in both directions. FeeProxy is available on Intuition Testnet; the bridge contracts remain mainnet-only.

`getFeeProxyAddressFromChainId(13579)` resolves the candidate testnet FeeProxy. Mainnet lookup throws until deployment; wrappers also accept an explicit address.

## Usage

Resolve a published deployment address:

```ts
import { getMetaNativeSpokeAddressFromChainId } from '@0xintuition/periphery';

const spokeAddress = getMetaNativeSpokeAddressFromChainId(1155);
```

`getTrustSwapAndBridgeRouterAddressFromChainId(base.id)` throws `Contract TrustSwapAndBridgeRouter not found for chain ID 8453` while the router is pending redeployment.

Generate deterministic calldata for a bridge call:

```ts
import { trustSwapAndBridgeRouterBridgeTrustEncode } from '@0xintuition/periphery';

const calldata = trustSwapAndBridgeRouterBridgeTrustEncode(
	1_000n,
	'0x2222222222222222222222222222222222222222'
);
```

## Relationship to Other Packages

- `@0xintuition/periphery` is the direct periphery helper package.
- `@0xintuition/protocol` is core-only and does not own router, bridge, or meta-bridge helpers.
- `@0xintuition/cli` uses these helpers as part of the shipped executable/library release stack.

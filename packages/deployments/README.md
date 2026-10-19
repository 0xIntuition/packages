# @0xintuition/deployments

The single source of Intuition contract ABIs, deploy bytecode, deployment addresses and chain metadata. `@0xintuition/protocol`, `@0xintuition/periphery`, `@0xintuition/sdk` and `@0xintuition/cli` all read from here.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/deployments
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Entry points

| Import | Contents |
| --- | --- |
| `@0xintuition/deployments` | `<Name>Abi` for every published contract, `MultiVaultWithRevertsAbi` / `MultiVaultBubbledErrorsAbi`, core and periphery address maps, `intuitionMainnet` / `intuitionTestnet` chains, chain ID constants, simple address lookups |
| `@0xintuition/deployments/bytecode` | `<Name>Bytecode` for every deployable contract. Kept off the root entry so ABI and address consumers do not ship bytecode. |

## Usage

```ts
import {
  getMultiVaultAddressFromChainId,
  intuitionMainnet,
  MultiVaultAbi,
} from '@0xintuition/deployments'

const multiVault = getMultiVaultAddressFromChainId(intuitionMainnet.id)
```

## Networks

- Intuition mainnet `1155` and Base `8453`.
- Intuition testnet `13579` and Base Sepolia `84532`.

## Artifacts

ABIs and bytecode are generated from the Intuition contracts build.

`MetaERC20Hub`, `MetaERC20Spoke` and `MetaNativeSpoke` are Metalayer contracts. Their ABI and bytecode are vendored as-is. Their `<Name>Bytecode` exports are the deployed runtime code, not creation code, so they cannot be used to deploy.

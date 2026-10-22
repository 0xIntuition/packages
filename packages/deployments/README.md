# @0xintuition/deployments

The single source of Intuition contract ABIs, deploy bytecode, deployment addresses and chain metadata. `@0xintuition/protocol`, `@0xintuition/periphery`, `@0xintuition/sdk` and `@0xintuition/cli` all read from here.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/deployments@alpha
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

## Candidate compatibility

Core v1.1.0 artifacts match `@0xintuition/contracts-v2@1.1.0-alpha.1`; router artifacts match `@0xintuition/contracts-v2-periphery@1.1.0-alpha.0`. A deployment address alone does not imply support for the new ABI:
mainnet must be upgraded before new functions can be used there. See the
[contract artifact provenance](https://github.com/0xIntuition/packages/blob/update/v1.1.0-alpha/docs/contract-artifacts.md).

`MultiVaultBytecode` includes an unresolved `MultiVaultLib` link placeholder.
Link the library using the matching Foundry build's link references before deployment.
`MultiVaultMigrationModeAbi` and `MultiVaultMigrationModeBytecode` now match
`@0xintuition/contracts-v2@1.1.0-alpha.1`. Its `previewTripleCreate` accepts
subject, predicate, and object IDs; decoded parameter/event names follow the new
implementation. Do not use this ABI as evidence that an older deployed migration
contract has been upgraded.

Historical or custom addresses can be supplied through `AddressOverrides` as the
last argument to the core address helpers. Both generic call orders,
`(name, chainId, overrides)` and `(chainId, name, overrides)`, are supported.

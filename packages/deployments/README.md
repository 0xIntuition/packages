# @0xintuition/deployments

Typed Intuition chain metadata, deployment addresses, and lookup helpers.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/deployments@alpha
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Usage

```ts
import {
  getMultiVaultAddressFromChainId,
  intuitionMainnet,
} from '@0xintuition/deployments'

const multiVault = getMultiVaultAddressFromChainId(intuitionMainnet.id)
```

This package owns protocol deployment addresses. Periphery-specific bridge/router deployments remain in `@0xintuition/periphery` because those addresses are tied to periphery helper surfaces rather than core protocol contract ABIs.

## Address overrides

Pass an `AddressOverrides` map as the optional trailing argument to any lookup
helper. An override for the requested contract and chain wins over
`intuitionDeployments`; missing entries fall back to the table. A lookup throws
when neither source has an address. The generic helper accepts
`(name, chainId, overrides?)` and `(chainId, name, overrides?)`; existing calls
without overrides continue to work.

```ts
import {
  getMultiVaultAddressFromChainId,
  mergeAddressOverrides,
  parseAddressOverrides,
  summarizeContractAddressSet,
  type AddressOverrides,
} from '@0xintuition/deployments'

const legacy: AddressOverrides = {
  MultiVault: { 13579: '0xeBc49d356B7f64D888130D85CC6D17114a6843ec' },
}
const parsed = parseAddressOverrides(
  '{"MultiVault":{"13579":"0xF76d6976DeBFbB012ebc53e925BC4AEFCaA7C6c6"}}',
  { source: 'CONTRACT_ADDRESS_OVERRIDES' },
)
const overrides = mergeAddressOverrides(legacy, parsed)
const multiVault = getMultiVaultAddressFromChainId(13579, overrides)
const summary = summarizeContractAddressSet(13579, overrides)
```

`parseAddressOverrides` accepts a JSON string keyed by deployment name, with
per-contract objects mapping chain IDs to EVM addresses. `undefined`, `null`, an
empty string, whitespace-only input, and `'{}'` yield an empty map. Empty
per-contract objects are also accepted. The parser reads no environment variables;
the caller supplies the input.

Names are case-sensitive and must appear in the frozen
`INTUITION_DEPLOYMENT_NAMES` list. `isIntuitionDeploymentName` checks names. Chain
keys must be positive decimal integers without leading zeros and within the safe
integer range; surrounding whitespace is trimmed, and colliding trimmed keys are
rejected. Addresses may be lowercase, uppercase, or correctly EIP-55 checksummed;
the parser normalizes them to checksum form. Malformed input throws
`AddressOverridesParseError`, with the optional `ParseAddressOverridesOptions.source`
label included once in the message and exposed on the error's `source` property.

`mergeAddressOverrides` combines maps without mutating them: later layers win for
each contract and chain, and no entries yields `undefined`. Thus the example's
parsed JSON wins over the legacy map, and both win over the deployment table.
`hasAddressOverrides` checks for at least one defined entry, ignoring empty maps.

`resolveContractAddressSet` returns the effective addresses for one chain, omitting
unavailable contracts. `listOverriddenContractNames` lists names whose override
differs from the canonical table, including addresses on otherwise unknown chains.
`summarizeContractAddressSet` combines those results into a
`ContractAddressSetSummary` containing `chainId`, `overridden`, and `resolvedSet`.

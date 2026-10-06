# @0xintuition/protocol

Core Intuition protocol contract ABIs, event parsers, and interaction helpers for MultiVault, Trust, TrustBonding, WrappedTrust, and emissions controllers.

Versioned as `3.1.0`. The `3.0.0` major bump (vs the legacy `2.x` line) reflects deployment addresses and chain metadata being extracted into `@0xintuition/deployments`. See the root release runbook for the current `latest` / `alpha` dist-tag policy.

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

## AtomWarden

AtomWarden helpers read claim limits and signer settings, submit ownership claims, and update authorized configuration. Supply the AtomWarden address and a public client for reads; writes also require a wallet client and simulate before submission.

```ts
import { atomWardenClaimWindow } from '@0xintuition/protocol'

const claimWindow = await atomWardenClaimWindow({
  address: atomWardenAddress,
  publicClient,
})
```

## Dynamic-fee curve

DynamicFeeFlatPriceCurve helpers read tier settings, quote fees, inspect stakes and claimable rewards, and submit claims. Deposit quotes account for every tier band the deposit crosses. Supply the deployed curve address; `eventParseClaimed`, `eventParseDepositRecorded`, and `eventParseDepositBandRecorded` parse its transaction receipts.

```ts
import { dynamicFeeFlatPriceCurveQuoteDepositFee } from '@0xintuition/protocol'

const fee = await dynamicFeeFlatPriceCurveQuoteDepositFee(
  { address: curveAddress, publicClient },
  { args: [termId, assets] },
)
```

## BondingCurveRegistry

Registry helpers resolve a curve address by ID and preview the assets required to mint shares against a supplied vault state. Pass the registry address through the same read configuration used by other protocol helpers.

```ts
import { bondingCurveRegistryCurveAddresses } from '@0xintuition/protocol'

const curveAddress = await bondingCurveRegistryCurveAddresses(
  { address: registryAddress, publicClient },
  { args: [curveId] },
)
```

## MultiVault approvals

`ApprovalTypes` exposes deposit, redemption, and creation permission bits and their combinations. The creator can authorize an operator with `multiVaultApprove`; `multiVaultIsApprovedToCreate`, `multiVaultIsApprovedToDeposit`, and `multiVaultIsApprovedToRedeem` read the corresponding permissions. In the write examples, `writeConfig` contains the MultiVault `address`, `publicClient`, and `walletClient`.

```ts
import { ApprovalTypes, multiVaultApprove } from '@0xintuition/protocol'

const hash = await multiVaultApprove(writeConfig, {
  args: [operatorAddress, ApprovalTypes.CREATION],
})
```

## Create on behalf of another account

`multiVaultCreateAtomsFor` attributes atoms and create-payment utilization to the supplied creator; `multiVaultCreateTriplesFor` attributes create-payment utilization to that creator. The creator must grant the submitting caller creation approval unless they are the same account. Both helpers have calldata encoders and accept an optional transaction value.

```ts
import { multiVaultCreateAtomsFor } from '@0xintuition/protocol'

const hash = await multiVaultCreateAtomsFor(writeConfig, {
  args: [creatorAddress, [atomData], [assets]],
  value: assets,
})
```

## MultiVault multicall

`multiVaultMulticall` submits an atomic batch of encoded MultiVault calls with explicit value allocations. Each call retains the submitting caller and its approval requirements. The allocation array must sum to the transaction value; approval and redemption calls receive zero. `multiVaultMulticallEncode` encodes the same batch for later submission.

```ts
import {
  ApprovalTypes,
  multiVaultApproveEncode,
  multiVaultCreateAtomsForEncode,
  multiVaultMulticall,
} from '@0xintuition/protocol'

const calls = [
  multiVaultApproveEncode(operatorAddress, ApprovalTypes.CREATION),
  multiVaultCreateAtomsForEncode(creatorAddress, [atomData], [assets]),
]
const hash = await multiVaultMulticall(writeConfig, {
  args: [calls, [0n, assets]],
  value: assets,
})
```

## Package Boundary

`@0xintuition/protocol` does not export deployment addresses, chain definitions, or address lookup helpers in this alpha. Use `@0xintuition/deployments` for core protocol deployments and `@0xintuition/periphery` for periphery bridge/router deployments.

The package depends on `@0xintuition/curves` for deprecated compatibility re-exports of curve helpers. New consumers should import curve math from `@0xintuition/curves` directly.

## URI-aware atom creation (3.1.0)

`multiVaultGetAtomUriConfig` reads `getAtomUriConfig` from MultiVault and returns the live `maxUriCount` and `maxUriLength`. Pass these limits to `multiVaultValidateCreateAtomsWithUris`, `multiVaultCreateAtomsWithUrisEncode`, or `multiVaultCreateAtomsWithUris` through `uriLimits` when validating against the latest configuration.

Each call uses `[creator, atomData, assets, uris]`, where `uris` contains one list per atom. Empty URI lists are supported. Atom data and every URI must be `0x`-prefixed, even-length hex bytes. Opaque bytes and empty atom data (`0x`) pass local validation; simulation determines whether the contract accepts them. URI context does not change atom bytes or term IDs.

Local validation checks a nonzero creator, aligned arrays, exact payment equal to the sum of assets, valid bytes, and optional URI count and byte-length limits. It does not replace simulation for approval errors, duplicate atoms, creation costs, or changes to live configuration. The encoder validates before returning calldata; the write helper validates, simulates, then submits the simulated request.

```ts
import {
  associateAtomCreationContext,
  eventParseAtomContextRegistered,
  eventParseAtomCreated,
  eventParseAtomUriConfigUpdated,
  multiVaultCreateAtomsWithUris,
  multiVaultCreateAtomsWithUrisEncode,
  multiVaultGetAtomUriConfig,
  multiVaultValidateCreateAtomsWithUris,
} from '@0xintuition/protocol'
import { toHex } from 'viem'

const uriLimits = await multiVaultGetAtomUriConfig(writeConfig)
const inputs = {
  args: [creatorAddress, [atomData], [assets], [[toHex('https://example.test/atom')]]],
  value: assets,
  uriLimits,
} as const

multiVaultValidateCreateAtomsWithUris(inputs)
const calldata = multiVaultCreateAtomsWithUrisEncode(inputs)
const hash = await multiVaultCreateAtomsWithUris(writeConfig, inputs)
const atoms = await eventParseAtomCreated(publicClient, hash)
const contexts = await eventParseAtomContextRegistered(publicClient, hash)
const creations = associateAtomCreationContext(atoms, contexts)
```

`eventParseAtomContextRegistered` preserves the ordered URI bytes in creation receipts. `associateAtomCreationContext` joins these events to `AtomCreated` by `termId`, even when other events interleave, and returns an empty context list for atoms without context. `eventParseAtomUriConfigUpdated(publicClient, hash)` parses limit changes from configuration transaction receipts. Receipt parsers currently consider all emitters; callers that require address scoping must filter parsed logs by the expected MultiVault address before associating them.

`contractsV2Provenance` records the registry package/version, lockfile integrity, and ABI/bytecode fingerprints shipped by the package. The legacy `multiVaultCreateAtoms` helpers remain available with their existing signatures.

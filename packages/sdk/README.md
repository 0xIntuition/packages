# @0xintuition/sdk

Public TypeScript SDK contract for external Intuition integrators.

This package sits above [`@0xintuition/protocol`](../protocol/README.md) and is the open-source integration layer for:

- backend services and scripts running in Node.js
- browser applications using injected wallets or wallet adapters
- agents and automation that need typed read models plus explicit onchain action plans

The v1 design is intentionally narrow:

- backend API reads
- core onchain protocol actions and action-planning helpers
- deterministic utilities such as IDs, predicates, and formatting

Out of scope for v1:

- React hooks and framework-specific clients
- broad indexing/search helpers
- application-specific orchestration
- direct upload helpers for Pinata or other storage providers

## Status

This is the `4.0.0` candidate, published to `alpha` only after release gates pass. It contains protocol re-exports, deterministic utilities, and higher-level action helpers. The v1 design terminology below describes the integration API design, not the npm major version. Contract artifacts are pending authoritative publication; new functions require matching deployments.

Import guidance:
- [`./docs/migration.md`](./docs/migration.md)

Examples:
- [`./docs/examples/nodejs.md`](./docs/examples/nodejs.md)
- [`./docs/examples/browser.md`](./docs/examples/browser.md)
- [`./docs/examples/content-uri-workflow.md`](./docs/examples/content-uri-workflow.md)

## Installation

```bash
bun add @0xintuition/sdk@alpha viem
```

`viem` is a peer dependency (`^2.0.0`). Release smoke tests install `viem@2.31.4`.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Supported Runtimes

- Node.js 20+
- modern browsers with `fetch`, `URL`, and wallet/provider support

The SDK v1 contract avoids Node-only globals in its browser-facing modules and avoids React/runtime-specific assumptions in its shared modules.

## Public Entrypoints

Available today:

- `@0xintuition/sdk`
- `@0xintuition/sdk/api`
- `@0xintuition/sdk/actions`
- `@0xintuition/sdk/protocol`
- `@0xintuition/sdk/utils`
- `@0xintuition/sdk/trust-swap-and-bridge-router`

## Import Guidance

Use SDK-owned subpaths for new code:

- `@0xintuition/sdk/api` for backend reads
- `@0xintuition/sdk/actions` for onchain planning helpers
- `@0xintuition/sdk/utils` for deterministic helpers
- `@0xintuition/predicates` for the canonical predicate registry, atom-data helpers, and launch constants
- `@0xintuition/sdk/protocol` only when you need low-level protocol escape hatches

The root `@0xintuition/sdk` export still forwards `@0xintuition/protocol` today for compatibility. Treat that as a transition layer rather than the preferred long-term import path; if you need direct protocol access, prefer `@0xintuition/sdk/protocol`.

## Public API Areas

`@0xintuition/sdk` currently exposes:

- a minimal API client for external backend reads via `createIntuitionApiClient`
- normalized API read models for:
  - `atoms.getById`
  - `atoms.getByLabel`
  - `atoms.getByData`
  - `triples.getById`
- deterministic IDs and predicate helpers such as `calculateAtomId` and `calculateTripleId`
- onchain action helpers, the full current list by area:
  - **MultiVault** (`actions/multivault.ts`): `multivaultQuoteDepositPlan`, `multivaultPrepareDepositTx`, `multivaultGetUserPositionSnapshot`, `multivaultQuoteRedeemPlan`, `multivaultPrepareRedeemTx`, `multivaultCreateAndSeedTerm`, `multivaultGetUtilizationAnalyticsBundle`, `multivaultPrepareOnBehalfOfCreationPlan`, `multivaultPrepareMulticallTx` (consolidated payable `multicall` batching)
  - **Dynamic-fee curve** (`actions/dynamic-fee-curve.ts`): `dynamicFeeCurveGetTierLadder`, `dynamicFeeCurveQuoteDepositPlan`, `dynamicFeeCurvePrepareDepositTx`, `dynamicFeeCurveGetClaimableAcrossTerms`, `dynamicFeeCurvePrepareClaimTx`
  - **FeeProxy** (`actions/fee-proxy.ts`): `feeProxyPrepareCreateAtomsWithUrisTx`
  - **TrustBonding** (`actions/trust-bonding.ts`): `trustBondingGetRewardsDashboard`, `trustBondingGetClaimActionState`, `trustBondingPrepareLockAction`, `trustBondingClaimAndRestakePlan`, `trustBondingGetLockStateSummary`, `trustBondingGetEpochRewardsTimeline`
  - **Portfolio** (`actions/portfolio.ts`): `portfolioGetIntuitionPositionsSnapshot`, `portfolioGetActionableState`
- protocol-level exports inherited from `@0xintuition/protocol`

The v1 design keeps the action helpers and deterministic utilities as first-class SDK responsibilities, while treating the current wholesale protocol re-export as broader than the intended long-term public surface.

## Configuration Model

Onchain modules use explicit viem-based configuration objects:

- `ReadConfig`
- `WriteConfig`

The v1 API-read layer uses explicit base URL plus optional auth:

- unauthenticated reads for public graph/content lookups
- optional bearer token or API key for future protected endpoints
- no dependency on application auth clients

## IPFS and Content Uploads

The SDK v1 does not own content upload. Content-addressed workflows should upload through an IPFS pinning service such as Pinata, then pass the resulting `ipfs://...` URI into SDK onchain actions.

That separation keeps upload/provider concerns out of the public SDK surface and avoids leaking Pinata-specific configuration into browser and Node consumers that only need to submit protocol actions.

## Minimal Example

```ts
import {
  calculateAtomId,
  createIntuitionApiClient,
  getIntuitionApiUrl,
  getMultiVaultAddressFromChainId,
  intuitionTestnet,
  multivaultCreateAndSeedTerm,
} from '@0xintuition/sdk'
import { createPublicClient, createWalletClient, http } from 'viem'

const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http(),
})

const walletClient = createWalletClient({
  chain: intuitionTestnet,
  transport: http(),
  account,
})

const config = {
  address: getMultiVaultAddressFromChainId(intuitionTestnet.id),
  publicClient,
  walletClient,
}

const api = createIntuitionApiClient({
  baseUrl: getIntuitionApiUrl('mainnet'),
})

const existingAtom = await api.atoms.getByLabel({ label: 'example' })
const existingTriple = await api.triples.getById({ termId: '0xtriple...' })
const contentUri = 'ipfs://bafy...'

const plan = await multivaultCreateAndSeedTerm(config, {
  receiver: account.address,
  atomsToCreate: [
    {
      termId: existingAtom?.termId ?? calculateAtomId(contentUri),
      data: '0x697066733a2f2f626166792e2e2e',
      assetsIn: 1_000_000_000_000_000n,
    },
  ],
  seedDeposits: [],
})
```

`existingTriple` is optional here; the example shows that the read layer now covers both atom and triple lookups while onchain actions remain explicit.

See the linked example docs for full Node.js, browser, and content-URI workflows.

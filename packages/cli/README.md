# @0xintuition/cli

Agent-oriented, side-effect-free calldata encoders, plan builders, and an executable `intuition` command for Intuition protocol surfaces.

## Install

```bash
npm install @0xintuition/cli@alpha
```

Install the executable globally when you want the `intuition` command on your PATH:

```bash
npm install -g @0xintuition/cli@alpha
```

Runtime: ESM-only, Node.js 20+. The executable bundles its protocol, periphery and SDK code. The package declares those packages as exact dependencies because its exported TypeScript types reference their APIs; it also depends on `viem`.

## Purpose

- Return pure encoded calldata (`Hex`) only.
- Return pure `AgentActionEnvelope` plans for supported workflows.
- Expose a Node-runnable `intuition` executable for encoder discovery and calldata generation.
- No wallet/public clients inside the CLI package.
- No `ReadConfig` / `WriteConfig`.
- No simulation or tx submission side effects.

## Network Support

Core targets now resolve across production plus testnet-safe chains:

- Intuition mainnet: `1155`
- Intuition testnet: `13579`
- Base mainnet: `8453`
- Base Sepolia: `84532`

Canonical bridge targets remain mainnet-focused:

- Base mainnet for `meta-erc20-hub`; `trust-swap-and-bridge-router` lookup throws pending a compatible redeployment
- Intuition mainnet for `meta-erc20-spoke` and `meta-native-spoke`
- FeeProxy and dynamic-fee curve targets carry explicit addresses; both accept `1155` and `13579`; FeeProxy is deployed on both networks, and the dynamic-fee curve has a canonical deployment on testnet only

See [docs/network-support-matrix.md](./docs/network-support-matrix.md) for the exact contract-by-chain matrix and explicit unsupported combinations.

## Scope

- Core protocol contract-call surfaces:
  - MultiVault
  - Trust
  - TrustBonding
  - WrappedTrust
  - BaseEmissionsController
  - SatelliteEmissionsController
- Periphery contract-call surfaces:
  - TrustSwapAndBridgeRouter
  - Meta bridge wrappers (MetaERC20Hub, MetaERC20Spoke, MetaNativeSpoke)
- Shared action envelope schema and plan builders:
  - `AgentActionEnvelope`
  - `AgentActionStep`
  - `AgentActionMetadata`
  - `buildBaseERC20BridgeToIntuitionPlan`
  - `buildMultiVaultDepositPlan`
  - `buildMultiVaultRedeemPlan`
  - `buildMultiVaultCreateAndSeedPlan`
  - `buildTrustBondingClaimPlan`
  - `buildTrustBondingLockPlan`
  - `buildTrustBondingClaimAndRestakePlan`
  - `buildBaseTrustBridgeToIntuitionPlan`
  - `buildIntuitionERC20BridgeToBasePlan`
  - `buildIntuitionTrustBridgeToBasePlan`

## Encoder Layout

Encoders are organized per contract and split by `read`/`write` folders:

```text
src/encoders/core/<contract>/{read,write}/*
src/encoders/periphery/<contract>/{read,write}/*
```

## Low-Level Encoder Example

Use low-level encoders when your agent already knows the exact contract call it wants to submit and only needs deterministic calldata.

```ts
import {
	buildBaseTrustBridgeToIntuitionPlan,
	createAgentActionEnvelope,
	trustSwapAndBridgeRouterBridgeTrustEncode,
} from '@0xintuition/cli';

const calldata = trustSwapAndBridgeRouterBridgeTrustEncode(
	1_000n,
	'0x2222222222222222222222222222222222222222'
);

const baseBridgeStep = createAgentActionEnvelope({
	action: 'base.trust.bridgeToIntuition',
	steps: [
		{
			id: 'bridge-trust',
			intent: {
				chainId: 8453,
				contract: 'trust-swap-and-bridge-router',
			},
			data: calldata,
			value: '123',
		},
	],
});

const bridgePlan = await buildBaseTrustBridgeToIntuitionPlan({
	owner: '0x1111111111111111111111111111111111111111',
	recipient: '0x2222222222222222222222222222222222222222',
	trustAmount: 1000n,
	readContext: {
		currentAllowance: 0n,
		bridgeFee: 123n,
	},
});
```

This example is explicitly Base mainnet scoped via `chainId: 8453`.

No `TrustSwapAndBridgeRouter` address is published yet: the router on Base predates the `deadline` parameter this package encodes, and a redeploy is pending. Until its address is published, router steps and `buildBaseTrustBridgeToIntuitionPlan` throw `Contract TrustSwapAndBridgeRouter not found for chain ID 8453`.

The bridge plan surface now includes all first-class mainnet bridge actions:

- `base.trust.bridgeToIntuition`
- `intuition.trust.bridgeToBase`
- `base.usdc.bridgeToIntuition`
- `intuition.usdc.bridgeToBase`
- `base.weth.bridgeToIntuition`
- `intuition.weth.bridgeToBase`

## High-Level Plan Example

Use high-level plan builders when your agent wants a validated, chain-aware action envelope for a workflow instead of manually stitching together steps.

```ts
import { buildMultiVaultDepositPlan } from '@0xintuition/cli';

const intuitionDepositPlan = await buildMultiVaultDepositPlan({
	multiVaultAddress: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
	receiver: '0x1111111111111111111111111111111111111111',
	termId: `0x${'12'.repeat(32)}`,
	curveId: 1n,
	assetsIn: 1_000n,
	slippageBps: 100n,
	readContext: {
		previewDeposit: {
			sharesOut: 500n,
			assetsAfterFees: 990n,
		},
		entryFeeAmount: 5n,
		protocolFeeAmount: 5n,
		currentSharePrice: 2_000_000_000_000_000_000n,
	},
});
```

This example is explicitly Intuition mainnet scoped via the `multivault` target on `chainId: 1155`.

The same plan builders now support Intuition testnet by passing `chainId: 13579`.

## Executable CLI

List the published encoder surface:

```bash
intuition encoders list
intuition encoders list --surface core --contract trust --kind write --json
```

Generate calldata from the terminal:

```bash
intuition encode trustApproveEncode --args '["0x1111111111111111111111111111111111111111","1000"]'
intuition encode trustSwapAndBridgeRouterBridgeTrustEncode --args '["1000","0x2222222222222222222222222222222222222222"]' --json
```

`--args` must be a JSON array. Integer ABI inputs should be passed as decimal strings for portability.

## Consumer Verification

`@0xintuition/cli` builds are package-local and expect the sibling packages to be built first; from the repository root, `bun run build` builds them in dependency order.

The package ships a built-consumer smoke check. Release-wide tarball validation runs from the repository root.

```bash
bun run --cwd packages/cli build
bun run --cwd packages/cli test
bun run --cwd packages/cli test:smoke:dist
bun run smoke:tarballs
```

## Help Listing

Use the built-in command to print an agent-friendly catalog:

```bash
bun run help:encoders
bun run help:encoders -- --surface=core --contract=multivault --kind=write
bun run help:encoders -- --surface=periphery --contract=meta-bridge --kind=write
bun run help:encoders -- --summary
```

## Relationship to Other Packages

- `@0xintuition/protocol`: read/simulate/write wrappers (client-based).
- `@0xintuition/sdk`: workflow math and action-state helpers used by the pure CLI plans.
- `@0xintuition/cli`: pure encoders plus pure workflow plans for autonomous execution systems, with an executable Node CLI layered on top.

## Packaging Contract

- Published entrypoint: `dist/index.js`
- Published types: `dist/index.d.ts`
- Published executable: `dist/bin/intuition.js`
- Published contents: `dist`, `README.md`, `LICENSE`, and `docs`

## Coverage Matrix

- Network resolution support is tracked in [docs/network-support-matrix.md](./docs/network-support-matrix.md).

## Pure action plan ownership

Client-free, JSON-serializable envelope builders live in `@0xintuition/sdk/actions`.
They accept caller-supplied read context and compose the SDK's quote and transaction
preparation actions. The CLI aliases retain their inputs and output format for one
release and are deprecated. Import the SDK names for new integrations. The
`intuition` executable currently exposes encoder commands; it has no plan command.
Envelope metadata now reports `source.package` as `@0xintuition/sdk` through both
the SDK names and the deprecated aliases, since the SDK owns the builders.

| Deprecated CLI name | SDK actions name |
| --- | --- |
| `buildBaseTrustBridgeToIntuitionPlan` | `baseTrustBridgeToIntuitionEnvelope` |
| `buildIntuitionTrustBridgeToBasePlan` | `intuitionTrustBridgeToBaseEnvelope` |
| `buildBaseERC20BridgeToIntuitionPlan` | `baseERC20BridgeToIntuitionEnvelope` |
| `buildIntuitionERC20BridgeToBasePlan` | `intuitionERC20BridgeToBaseEnvelope` |
| `buildTrustBondingClaimPlan` | `trustBondingClaimEnvelope` |
| `buildTrustBondingLockPlan` | `trustBondingLockEnvelope` |
| `buildTrustBondingClaimAndRestakePlan` | `trustBondingClaimAndRestakeEnvelope` |
| `buildFeeProxyCreateAtomsWithUrisPlan` | `feeProxyCreateAtomsWithUrisEnvelope` |
| `buildMultiVaultDepositPlan` | `multiVaultDepositEnvelope` |
| `buildMultiVaultRedeemPlan` | `multiVaultRedeemEnvelope` |
| `buildMultiVaultCreateAndSeedPlan` | `multiVaultCreateAndSeedEnvelope` |
| `buildMultiVaultOnBehalfOfCreationPlan` | `multiVaultOnBehalfOfCreationEnvelope` |
| `buildMultiVaultMulticallPlan` | `multiVaultMulticallEnvelope` |
| `buildDynamicFeeCurveDepositPlan` | `dynamicFeeCurveDepositEnvelope` |
| `buildDynamicFeeCurveClaimPlan` | `dynamicFeeCurveClaimEnvelope` |

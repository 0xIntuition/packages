import assert from 'node:assert/strict';

const cli = await import(new URL('../dist/index.js', import.meta.url).href);

const {
	buildMultiVaultDepositPlan,
	createAgentActionEnvelope,
	resolveAgentActionTarget,
	trustSwapAndBridgeRouterBridgeTrustEncode,
} = cli;

// No router address is published until the deadline router is redeployed, so router steps on
// Base fail closed; the encoder itself still ships.
assert.equal(typeof trustSwapAndBridgeRouterBridgeTrustEncode, 'function');
assert.throws(
	() =>
		resolveAgentActionTarget({
			chainId: 8453,
			contract: 'trust-swap-and-bridge-router',
		}),
	/Contract TrustSwapAndBridgeRouter not found for chain ID 8453/
);

const baseEnvelope = createAgentActionEnvelope({
	action: 'trust.approve',
	steps: [
		{
			id: 'approve',
			intent: {
				chainId: 8453,
				contract: 'trust',
			},
			data: '0x095ea7b3',
		},
	],
});

const baseSepoliaEnvelope = createAgentActionEnvelope({
	action: 'trust.approve',
	steps: [
		{
			id: 'approve',
			intent: {
				chainId: 84532,
				contract: 'trust',
			},
			data: '0x095ea7b3',
		},
	],
});

const intuitionTestnetDepositPlan = await buildMultiVaultDepositPlan({
	chainId: 13579,
	multiVaultAddress: '0xF76d6976DeBFbB012ebc53e925BC4AEFCaA7C6c6',
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

assert.throws(
	() =>
		resolveAgentActionTarget({
			chainId: 84532,
			contract: 'trust-swap-and-bridge-router',
		}),
	/Contract trust-swap-and-bridge-router is not supported on chain ID 84532/
);

const serialized = JSON.stringify({
	base: baseEnvelope,
	baseSepolia: baseSepoliaEnvelope,
	intuitionTestnet: intuitionTestnetDepositPlan,
});

assert.equal(baseEnvelope.steps[0]?.target.chainId, 8453);
assert.equal(baseSepoliaEnvelope.steps[0]?.target.chainId, 84532);
assert.equal(
	baseSepoliaEnvelope.steps[0]?.target.address,
	'0xA54b4E6e356b963Ee00d1C947f478d9194a1a210'
);
assert.equal(intuitionTestnetDepositPlan.steps[0]?.target.chainId, 13579);
assert.match(serialized, /trust\.approve/);
assert.match(serialized, /multivault\.deposit/);
assert.match(serialized, /"schemaVersion":"1\.0\.0"/);

console.log('dist consumer smoke passed');

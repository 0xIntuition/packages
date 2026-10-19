import { describe, expect, it } from 'vitest';
import {
	createAgentActionEnvelope,
	resolveAgentActionTarget,
	validateAgentActionEnvelope,
} from './index';
import { type AgentActionStep, agentActionSchemaVersion } from './types';

describe('agent action schema', () => {
	it('creates an addressed envelope for Intuition mainnet core actions', () => {
		const envelope = createAgentActionEnvelope({
			action: 'multivault.deposit',
			steps: [
				{
					id: 'deposit',
					intent: {
						chainId: 1155,
						contract: 'multivault',
					},
					data: '0x1234',
					value: '1000',
				},
			],
			warnings: ['slippage not set'],
		});

		expect(envelope.schemaVersion).toBe(agentActionSchemaVersion);
		expect(envelope.action).toBe('multivault.deposit');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]).toMatchObject({
			id: 'deposit',
			to: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
			target: {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'core',
				flow: 'multivault',
				contract: 'multivault',
				deploymentName: 'MultiVault',
				address: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
			},
		});
	});

	it('creates an addressed envelope for Base mainnet core actions', () => {
		const envelope = createAgentActionEnvelope({
			action: 'baseEmissionsController.quoteGasPayment',
			steps: [
				{
					id: 'quote-gas-payment',
					intent: {
						chainId: 8453,
						contract: 'base-emissions-controller',
					},
					data: '0xdeadbeef',
				},
			],
		});

		expect(envelope.steps[0]).toMatchObject({
			to: '0x7745bDEe668501E5eeF7e9605C746f9cDfb60667',
			target: {
				chainId: 8453,
				chainName: 'Base',
				surface: 'core',
				flow: 'base-emissions-controller',
				contract: 'base-emissions-controller',
				deploymentName: 'BaseEmissionsController',
				address: '0x7745bDEe668501E5eeF7e9605C746f9cDfb60667',
			},
		});
	});

	it('creates an addressed envelope for Base Sepolia core actions', () => {
		const envelope = createAgentActionEnvelope({
			action: 'trust.approve',
			steps: [
				{
					id: 'approve',
					intent: {
						chainId: 84532,
						contract: 'trust',
					},
					data: '0xdeadbeef',
				},
			],
		});

		expect(envelope.steps[0]).toMatchObject({
			target: {
				chainId: 84532,
				chainName: 'Base Sepolia',
				surface: 'core',
				flow: 'trust',
				contract: 'trust',
				deploymentName: 'Trust',
				address: '0xA54b4E6e356b963Ee00d1C947f478d9194a1a210',
			},
		});
	});

	it('creates an addressed envelope for Intuition testnet core actions', () => {
		const envelope = createAgentActionEnvelope({
			action: 'wrappedTrust.deposit',
			steps: [
				{
					id: 'deposit',
					intent: {
						chainId: 13579,
						contract: 'wrapped-trust',
					},
					data: '0xdeadbeef',
					value: '1000',
				},
			],
		});

		expect(envelope.steps[0]).toMatchObject({
			target: {
				chainId: 13579,
				chainName: 'Intuition Testnet',
				surface: 'core',
				flow: 'wrapped-trust',
				contract: 'wrapped-trust',
				deploymentName: 'WrappedTrust',
				address: '0xDE80b6EE63f7D809427CA350e30093F436A0fe35',
			},
		});
	});

	it('resolves meta bridge targets with explicit contract identity', () => {
		expect(
			resolveAgentActionTarget({
				chainId: 1155,
				flow: 'meta-bridge',
				contract: 'meta-erc20-spoke',
				asset: 'WETH',
			})
		).toMatchObject({
			chainId: 1155,
			chainName: 'Intuition',
			surface: 'periphery',
			flow: 'meta-bridge',
			contract: 'meta-erc20-spoke',
			deploymentName: 'MetaERC20Spoke',
			address: '0xFB4BAa05BF339AD6074047176F90757A6C87f944',
			asset: 'WETH',
		});
	});

	it('resolves Base bridge asset targets for approval steps', () => {
		expect(
			resolveAgentActionTarget({
				chainId: 8453,
				flow: 'bridge-asset',
				contract: 'base-bridge-asset',
				asset: 'USDC',
			})
		).toMatchObject({
			chainId: 8453,
			chainName: 'Base',
			surface: 'periphery',
			flow: 'bridge-asset',
			contract: 'base-bridge-asset',
			deploymentName: 'BaseBridgeAsset',
			address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
			asset: 'USDC',
		});
	});

	it('has no published bridge router address to resolve until the deadline router is redeployed', () => {
		expect(() =>
			resolveAgentActionTarget({
				chainId: 8453,
				contract: 'trust-swap-and-bridge-router',
			})
		).toThrow('Contract TrustSwapAndBridgeRouter not found for chain ID 8453');
	});

	it('validates a fully addressed envelope', () => {
		const target = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'trustbonding',
		});

		const envelope = validateAgentActionEnvelope({
			schemaVersion: agentActionSchemaVersion,
			action: 'trustbonding.claimRewards',
			steps: [
				{
					id: 'claim',
					to: target.address,
					data: '0x1234',
					target,
				},
			],
		});

		expect(envelope.steps[0].target).toEqual(target);
	});

	it('normalizes addressed steps back to their resolved deployment addresses', () => {
		const target = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});

		const envelope = validateAgentActionEnvelope({
			schemaVersion: agentActionSchemaVersion,
			action: 'multivault.deposit',
			steps: [
				{
					id: 'deposit',
					to: target.address.toLowerCase() as typeof target.address,
					data: '0x1234',
					target: {
						...target,
						address: target.address.toLowerCase() as typeof target.address,
					},
				},
			],
		});

		expect(envelope.steps[0]?.to).toBe(target.address);
		expect(envelope.steps[0]?.target).toEqual(target);
	});

	it('rejects malformed addresses', () => {
		const target = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});

		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: agentActionSchemaVersion,
				action: 'multivault.deposit',
				steps: [
					{
						id: 'deposit',
						to: '0x1234',
						data: '0x1234',
						target,
					} as unknown as AgentActionStep,
				],
			})
		).toThrow('step "deposit" has an invalid to address: "0x1234".');
	});

	it('rejects malformed calldata hex', () => {
		expect(() =>
			createAgentActionEnvelope({
				action: 'multivault.deposit',
				steps: [
					{
						id: 'deposit',
						intent: {
							chainId: 1155,
							contract: 'multivault',
						},
						data: '1234',
					} as unknown as Parameters<typeof createAgentActionEnvelope>[0]['steps'][number],
				],
			})
		).toThrow('step "deposit" has invalid calldata hex: "1234".');
	});

	it('rejects addressed meta bridge steps with unsupported chain IDs', () => {
		const target = resolveAgentActionTarget({
			chainId: 8453,
			flow: 'meta-bridge',
			contract: 'meta-erc20-hub',
			asset: 'USDC',
		});

		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: agentActionSchemaVersion,
				action: 'metaBridge.transferRemote',
				steps: [
					{
						id: 'bridge',
						to: target.address,
						data: '0x1234',
						target: {
							...target,
							chainId: 1,
						},
					} as unknown as AgentActionStep,
				],
			})
		).toThrow('Unsupported chain ID 1. Supported chains: 1155, 13579, 8453, 84532.');
	});

	it('rejects unsupported chains', () => {
		expect(() =>
			createAgentActionEnvelope({
				action: 'multivault.deposit',
				steps: [
					{
						id: 'deposit',
						intent: {
							chainId: 1,
							contract: 'multivault',
						},
						data: '0x1234',
					} as unknown as Parameters<typeof createAgentActionEnvelope>[0]['steps'][number],
				],
			})
		).toThrow('Unsupported chain ID 1. Supported chains: 1155, 13579, 8453, 84532.');
	});

	it('rejects Intuition mainnet trust targets because TRUST is Base-only', () => {
		expect(() =>
			resolveAgentActionTarget({
				chainId: 1155,
				contract: 'trust',
			} as Parameters<typeof resolveAgentActionTarget>[0])
		).toThrow('Contract trust is not supported on chain ID 1155. Supported chains: 8453, 84532.');
	});

	it('rejects testnet periphery router targets with a clear support matrix error', () => {
		expect(() =>
			resolveAgentActionTarget({
				chainId: 84532,
				contract: 'trust-swap-and-bridge-router',
			} as Parameters<typeof resolveAgentActionTarget>[0])
		).toThrow(
			'Contract trust-swap-and-bridge-router is not supported on chain ID 84532. Supported chains: 8453.'
		);
	});

	it('rejects testnet meta bridge targets that have no published periphery deployment', () => {
		expect(() =>
			resolveAgentActionTarget({
				chainId: 13579,
				flow: 'meta-bridge',
				contract: 'meta-native-spoke',
			} as Parameters<typeof resolveAgentActionTarget>[0])
		).toThrow(
			'Contract meta-native-spoke is not supported on chain ID 13579. Supported chains: 1155.'
		);
	});

	it('rejects incomplete steps', () => {
		expect(() =>
			createAgentActionEnvelope({
				action: 'multivault.deposit',
				steps: [
					{
						id: 'deposit',
						data: '0x1234',
					} as unknown as Parameters<typeof createAgentActionEnvelope>[0]['steps'][number],
				],
			})
		).toThrow('step "deposit" must include either an intent or target metadata.');
	});

	it('rejects unsupported schema versions', () => {
		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: 'agent-action-envelope@0.0.0',
				action: 'multivault.deposit',
				steps: [
					{
						id: 'deposit',
						to: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
						data: '0x1234',
						target: resolveAgentActionTarget({
							chainId: 1155,
							contract: 'multivault',
						}),
					},
				],
			})
		).toThrow(
			`Unsupported agent action schema version "agent-action-envelope@0.0.0". Expected "${agentActionSchemaVersion}".`
		);
	});

	it('rejects envelopes with no steps during creation', () => {
		expect(() =>
			createAgentActionEnvelope({
				action: 'multivault.deposit',
				steps: [],
			})
		).toThrow('Agent action envelope must include at least one step.');
	});

	it('rejects envelopes with no steps during validation', () => {
		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: agentActionSchemaVersion,
				action: 'multivault.deposit',
				steps: [],
			})
		).toThrow('Agent action envelope must include at least one step.');
	});

	it('rejects addressed steps whose target surface does not match the resolved deployment', () => {
		const target = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});

		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: agentActionSchemaVersion,
				action: 'multivault.deposit',
				steps: [
					{
						id: 'deposit',
						to: target.address,
						data: '0x1234',
						target: {
							...target,
							surface: 'periphery',
						},
					} as unknown as AgentActionStep,
				],
			})
		).toThrow('step "deposit" target surface must be "core", received "periphery".');
	});

	it('rejects meta bridge targets missing required asset metadata', () => {
		const target = resolveAgentActionTarget({
			chainId: 8453,
			flow: 'meta-bridge',
			contract: 'meta-erc20-hub',
			asset: 'USDC',
		});

		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: agentActionSchemaVersion,
				action: 'metaBridge.transferRemote',
				steps: [
					{
						id: 'bridge',
						to: target.address,
						data: '0x1234',
						target: {
							...target,
							asset: undefined,
						},
					} as unknown as AgentActionStep,
				],
			})
		).toThrow('step "bridge" target asset is required for meta-erc20-hub.');
	});

	it('rejects non-meta targets that provide unexpected asset metadata', () => {
		const target = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});

		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: agentActionSchemaVersion,
				action: 'multivault.deposit',
				steps: [
					{
						id: 'deposit',
						to: target.address,
						data: '0x1234',
						target: {
							...target,
							asset: 'USDC',
						},
					} as unknown as AgentActionStep,
				],
			})
		).toThrow(
			'step "deposit" target asset is only supported for asset-aware targets (base-bridge-asset, meta-erc20-hub, meta-erc20-spoke).'
		);
	});

	it('rejects bridge asset targets missing their required asset metadata', () => {
		const target = resolveAgentActionTarget({
			chainId: 8453,
			flow: 'bridge-asset',
			contract: 'base-bridge-asset',
			asset: 'WETH',
		});

		expect(() =>
			validateAgentActionEnvelope({
				schemaVersion: agentActionSchemaVersion,
				action: 'base.weth.bridgeToIntuition',
				steps: [
					{
						id: 'approve-weth',
						to: target.address,
						data: '0x1234',
						target: {
							...target,
							asset: undefined,
						},
					} as unknown as AgentActionStep,
				],
			})
		).toThrow('step "approve-weth" target asset is required for base-bridge-asset.');
	});
});

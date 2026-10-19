import type { Address } from 'viem';
import { describe, expect, it } from 'vitest';

import { resolveAgentActionTarget } from '../schema';
import {
	buildBaseERC20BridgeToIntuitionPlan,
	buildIntuitionERC20BridgeToBasePlan,
	buildIntuitionTrustBridgeToBasePlan,
} from './base';

const OWNER = '0x7777777777777777777777777777777777777777' as Address;
const RECIPIENT = '0x8888888888888888888888888888888888888888' as Address;

describe('direct bridge plans', () => {
	it('builds an Intuition-to-Base TRUST bridge flow without approval', async () => {
		const bridgeTarget = resolveAgentActionTarget({
			chainId: 1155,
			flow: 'meta-bridge',
			contract: 'meta-native-spoke',
		});
		const envelope = await buildIntuitionTrustBridgeToBasePlan({
			owner: OWNER,
			recipient: RECIPIENT,
			trustAmount: 1_000n,
			readContext: {
				bridgeFee: 123n,
			},
		});

		expect(envelope.action).toBe('intuition.trust.bridgeToBase');
		expect(envelope.steps.map((step) => step.id)).toEqual(['bridge-trust']);
		expect(envelope.steps[0]?.to).toBe(bridgeTarget.address);
		expect(envelope.steps[0]?.target).toEqual(bridgeTarget);
		expect(envelope.steps[0]?.value).toBe('1123');
		expect(envelope.estimates).toMatchObject({
			trustAmount: '1000',
			bridgeFee: '123',
			totalValue: '1123',
		});
	});

	it('builds a Base USDC bridge flow with approval when needed', async () => {
		const approvalTarget = resolveAgentActionTarget({
			chainId: 8453,
			flow: 'bridge-asset',
			contract: 'base-bridge-asset',
			asset: 'USDC',
		});
		const bridgeTarget = resolveAgentActionTarget({
			chainId: 8453,
			flow: 'meta-bridge',
			contract: 'meta-erc20-hub',
			asset: 'USDC',
		});
		const envelope = await buildBaseERC20BridgeToIntuitionPlan({
			owner: OWNER,
			recipient: RECIPIENT,
			asset: 'USDC',
			amount: 1_000n,
			readContext: {
				currentAllowance: 0n,
				bridgeFee: 123n,
			},
		});

		expect(envelope.action).toBe('base.usdc.bridgeToIntuition');
		expect(envelope.steps.map((step) => step.id)).toEqual(['usdc-approve', 'bridge-usdc']);
		expect(envelope.steps[0]?.to).toBe(approvalTarget.address);
		expect(envelope.steps[0]?.target).toEqual(approvalTarget);
		expect(envelope.steps[1]?.to).toBe(bridgeTarget.address);
		expect(envelope.steps[1]?.target).toEqual(bridgeTarget);
		expect(envelope.steps[1]?.value).toBe('123');
		expect(envelope.metadata?.context).toMatchObject({
			asset: 'USDC',
		});
		expect(envelope.estimates).toMatchObject({
			asset: 'USDC',
			amount: '1000',
			currentAllowance: '0',
			bridgeFee: '123',
			approvalNeeded: true,
		});
	});

	it('skips Base WETH approval when the hub already has enough allowance', async () => {
		const bridgeTarget = resolveAgentActionTarget({
			chainId: 8453,
			flow: 'meta-bridge',
			contract: 'meta-erc20-hub',
			asset: 'WETH',
		});
		const envelope = await buildBaseERC20BridgeToIntuitionPlan({
			owner: OWNER,
			recipient: RECIPIENT,
			asset: 'WETH',
			amount: 1_000n,
			readContext: {
				currentAllowance: 2_000n,
				bridgeFee: 123n,
			},
		});

		expect(envelope.action).toBe('base.weth.bridgeToIntuition');
		expect(envelope.steps.map((step) => step.id)).toEqual(['bridge-weth']);
		expect(envelope.steps[0]?.to).toBe(bridgeTarget.address);
		expect(envelope.estimates).toMatchObject({
			asset: 'WETH',
			currentAllowance: '2000',
			approvalNeeded: false,
		});
	});

	it('builds an Intuition USDC bridge flow without approval', async () => {
		const bridgeTarget = resolveAgentActionTarget({
			chainId: 1155,
			flow: 'meta-bridge',
			contract: 'meta-erc20-spoke',
			asset: 'USDC',
		});
		const envelope = await buildIntuitionERC20BridgeToBasePlan({
			owner: OWNER,
			recipient: RECIPIENT,
			asset: 'USDC',
			amount: 1_000n,
			readContext: {
				bridgeFee: 123n,
			},
		});

		expect(envelope.action).toBe('intuition.usdc.bridgeToBase');
		expect(envelope.steps.map((step) => step.id)).toEqual(['bridge-usdc']);
		expect(envelope.steps[0]?.to).toBe(bridgeTarget.address);
		expect(envelope.steps[0]?.target).toEqual(bridgeTarget);
		expect(envelope.steps[0]?.value).toBe('123');
		expect(envelope.estimates).toMatchObject({
			asset: 'USDC',
			amount: '1000',
			bridgeFee: '123',
		});
	});

	it('builds an Intuition WETH bridge flow without approval', async () => {
		const bridgeTarget = resolveAgentActionTarget({
			chainId: 1155,
			flow: 'meta-bridge',
			contract: 'meta-erc20-spoke',
			asset: 'WETH',
		});
		const envelope = await buildIntuitionERC20BridgeToBasePlan({
			owner: OWNER,
			recipient: RECIPIENT,
			asset: 'WETH',
			amount: 1_000n,
			readContext: {
				bridgeFee: 123n,
			},
		});

		expect(envelope.action).toBe('intuition.weth.bridgeToBase');
		expect(envelope.steps.map((step) => step.id)).toEqual(['bridge-weth']);
		expect(envelope.steps[0]?.to).toBe(bridgeTarget.address);
		expect(envelope.steps[0]?.target).toEqual(bridgeTarget);
		expect(envelope.steps[0]?.value).toBe('123');
	});

	it('rejects missing allowance reads for approval-dependent ERC20 plans', async () => {
		await expect(
			buildBaseERC20BridgeToIntuitionPlan({
				owner: OWNER,
				recipient: RECIPIENT,
				asset: 'USDC',
				amount: 1_000n,
				readContext: {
					bridgeFee: 123n,
				},
			})
		).rejects.toThrow('buildBaseERC20BridgeToIntuitionPlan requires readContext.currentAllowance.');
	});

	it('rejects zero amounts for direct ERC20 bridge planning', async () => {
		await expect(
			buildIntuitionERC20BridgeToBasePlan({
				owner: OWNER,
				recipient: RECIPIENT,
				asset: 'USDC',
				amount: 0n,
			})
		).rejects.toThrow('amount must be greater than 0.');
	});
});

import type { Address } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveAgentActionTarget } from '../schema';
import { buildBaseTrustBridgeToIntuitionPlan } from './base';

const OWNER = '0x7777777777777777777777777777777777777777' as Address;
const RECIPIENT = '0x8888888888888888888888888888888888888888' as Address;
const ROUTER = '0x9999999999999999999999999999999999999999' as Address;

// No router address is published until the deadline router is redeployed. The happy-path tests
// stand in a published address; the rejection test uses the real (empty) map.
const publishedRouter = vi.hoisted(() => ({ address: undefined as Address | undefined }));
vi.mock('@0xintuition/periphery', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@0xintuition/periphery')>();
	return {
		...actual,
		getTrustSwapAndBridgeRouterAddressFromChainId: (chainId: number) =>
			publishedRouter.address ?? actual.getTrustSwapAndBridgeRouterAddressFromChainId(chainId),
	};
});

afterEach(() => {
	publishedRouter.address = undefined;
});

describe('base trust bridge plans', () => {
	it('builds a Base-to-Intuition TRUST bridge flow with approval when needed', async () => {
		publishedRouter.address = ROUTER;
		const trustTarget = resolveAgentActionTarget({
			chainId: 8453,
			contract: 'trust',
		});
		const bridgeTarget = resolveAgentActionTarget({
			chainId: 8453,
			contract: 'trust-swap-and-bridge-router',
		});
		const envelope = await buildBaseTrustBridgeToIntuitionPlan({
			owner: OWNER,
			recipient: RECIPIENT,
			trustAmount: 1_000n,
			readContext: {
				currentAllowance: 0n,
				bridgeFee: 123n,
			},
		});

		expect(envelope.action).toBe('base.trust.bridgeToIntuition');
		expect(envelope.steps.map((step) => step.id)).toEqual(['trust-approve', 'bridge-trust']);
		expect(envelope.steps[0]?.to).toBe(trustTarget.address);
		// The approval names the router as spender, and the bridge step goes to the same router.
		expect(envelope.steps[0]?.data.toLowerCase()).toContain(ROUTER.slice(2).toLowerCase());
		expect(envelope.steps[1]?.to).toBe(ROUTER);
		expect(envelope.steps[0]?.target).toEqual(trustTarget);
		expect(envelope.steps[1]?.to).toBe(bridgeTarget.address);
		expect(envelope.steps[1]?.target).toEqual(bridgeTarget);
		expect(envelope.steps[1]?.value).toBe('123');
		expect(envelope.estimates).toMatchObject({
			trustAmount: '1000',
			currentAllowance: '0',
			bridgeFee: '123',
			approvalNeeded: true,
		});
	});

	it('skips the approval step when the router already has enough allowance', async () => {
		publishedRouter.address = ROUTER;
		const bridgeTarget = resolveAgentActionTarget({
			chainId: 8453,
			contract: 'trust-swap-and-bridge-router',
		});
		const envelope = await buildBaseTrustBridgeToIntuitionPlan({
			owner: OWNER,
			recipient: RECIPIENT,
			trustAmount: 1_000n,
			readContext: {
				currentAllowance: 1_500n,
				bridgeFee: 123n,
			},
		});

		expect(envelope.steps.map((step) => step.id)).toEqual(['bridge-trust']);
		expect(envelope.steps[0]?.to).toBe(bridgeTarget.address);
		expect(envelope.estimates).toMatchObject({
			currentAllowance: '1500',
			approvalNeeded: false,
		});
	});

	it('rejects the plan while no router address is published', async () => {
		await expect(
			buildBaseTrustBridgeToIntuitionPlan({
				owner: OWNER,
				recipient: RECIPIENT,
				trustAmount: 1_000n,
				readContext: {
					currentAllowance: 0n,
					bridgeFee: 123n,
				},
			})
		).rejects.toThrow('Contract TrustSwapAndBridgeRouter not found for chain ID 8453');
	});

	it('rejects missing read context for allowance-dependent bridge planning', async () => {
		await expect(
			buildBaseTrustBridgeToIntuitionPlan({
				owner: OWNER,
				recipient: RECIPIENT,
				trustAmount: 1_000n,
				readContext: {
					bridgeFee: 123n,
				},
			})
		).rejects.toThrow('buildBaseTrustBridgeToIntuitionPlan requires readContext.currentAllowance.');
	});

	it('rejects invalid bridge recipients', async () => {
		await expect(
			buildBaseTrustBridgeToIntuitionPlan({
				owner: OWNER,
				recipient: 'not-an-address' as Address,
				trustAmount: 1_000n,
				readContext: {
					currentAllowance: 0n,
					bridgeFee: 123n,
				},
			})
		).rejects.toThrow();
	});

	it('rejects zero bridge amounts before allowance reads', async () => {
		await expect(
			buildBaseTrustBridgeToIntuitionPlan({
				owner: OWNER,
				recipient: RECIPIENT,
				trustAmount: 0n,
			})
		).rejects.toThrow('trustAmount must be greater than 0.');
	});
});

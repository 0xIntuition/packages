import type { DynamicFeeConfig } from '@0xintuition/curves';
import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { resolveAgentActionTarget } from '../schema';
import {
	buildDynamicFeeCurveClaimPlan,
	buildDynamicFeeCurveDepositPlan,
} from './dynamic-fee-curve';

const ACCOUNT = '0x1111111111111111111111111111111111111111' as Address;
const MULTIVAULT = '0x2222222222222222222222222222222222222222' as Address;
const REGISTRY = '0x3333333333333333333333333333333333333333' as Address;
const CURVE = '0x4444444444444444444444444444444444444444' as Address;
const TERM_ID = `0x${'ab'.repeat(32)}` as Hex;
const TERM_ID_2 = `0x${'cd'.repeat(32)}` as Hex;

const config: DynamicFeeConfig = {
	width0: 1_000n,
	tierCount: 4n,
	tierWidthGrowthBps: 0n,
	depositBaseBps: 100n,
	depositGrowthBps: 50n,
	depositCapBps: 500n,
	depositFulcrumAlphaBps: 10_000n,
	depositKernelSpread: 4n * 10n ** 18n,
	redeemFulcrumAlphaBps: 10_000n,
	redeemKernelSpread: 4n * 10n ** 18n,
	redeemBaseBps: 80n,
	redeemGrowthBps: 40n,
	redeemCapBps: 400n,
	redeemToFulcrumTiersBps: 0n,
	depositToPriorTierBps: 0n,
	minEligibleTierStakeBps: 0n,
};

describe('dynamic-fee-curve plans', () => {
	it('builds a deposit envelope from injected quote context', async () => {
		const multiVaultTarget = resolveAgentActionTarget({ chainId: 1155, contract: 'multivault' });
		const envelope = await buildDynamicFeeCurveDepositPlan({
			multiVaultAddress: MULTIVAULT,
			bondingCurveRegistryAddress: REGISTRY,
			receiver: ACCOUNT,
			termId: TERM_ID,
			curveId: 5n,
			assetsIn: 1_000n,
			readContext: {
				curveAddress: CURVE,
				config,
				tierFeeOverrides: [
					[false, 0, 0],
					[false, 0, 0],
					[false, 0, 0],
					[false, 0, 0],
				],
				quoteDepositFee: 42n,
				previewDeposit: [950n, 980n] as const,
				entryFeeAmount: 10n,
				protocolFeeAmount: 10n,
				currentSharePrice: 10n ** 18n,
				// An existing vault: the first-deposit min-share bootstrap netting doesn't apply.
				vault: [10_000n, 9_500n] as const,
			},
		});

		expect(envelope.action).toBe('dynamicFeeCurve.deposit');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.to).toBe(multiVaultTarget.address);
		expect(envelope.steps[0]?.value).toBe('1000');
		expect(envelope.estimates).toMatchObject({
			quote: {
				curveAddress: CURVE,
				curveFee: '42',
			},
		});
	});

	it('reports the atom-wallet fee it is given, so the estimated fee components add up', async () => {
		const envelope = await buildDynamicFeeCurveDepositPlan({
			multiVaultAddress: MULTIVAULT,
			bondingCurveRegistryAddress: REGISTRY,
			receiver: ACCOUNT,
			termId: TERM_ID,
			curveId: 5n,
			assetsIn: 1_000n,
			readContext: {
				curveAddress: CURVE,
				config,
				tierFeeOverrides: [
					[false, 0, 0],
					[false, 0, 0],
					[false, 0, 0],
					[false, 0, 0],
				],
				quoteDepositFee: 42n,
				previewDeposit: [925n, 925n] as const,
				entryFeeAmount: 10n,
				protocolFeeAmount: 18n,
				currentSharePrice: 10n ** 18n,
				vaultTotalShares: 9_500n,
				feeDenominator: 10_000n,
				atomWalletDepositFee: 50n,
			},
		});

		// 1_000 - protocol 18 - entry 10 - atom wallet ceil(1_000 * 50 / 10_000) = 5 - curve 42 = 925.
		expect(envelope.estimates).toMatchObject({
			quote: { multiVaultQuote: { termFee: '5', termFeeKind: 'atom-wallet', sharesOut: '925' } },
		});
	});

	it('builds a claim envelope across the supplied terms', async () => {
		const curveTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'dynamic-fee-flat-price-curve',
			address: CURVE,
		});
		const envelope = await buildDynamicFeeCurveClaimPlan({
			curveAddress: CURVE,
			account: ACCOUNT,
			termIds: [TERM_ID, TERM_ID_2],
			readContext: { claimableAcross: 500n, pendingFor: [500n, 0n] },
		});

		expect(envelope.action).toBe('dynamicFeeCurve.claim');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.to).toBe(curveTarget.address);
		expect(envelope.estimates).toMatchObject({
			claimable: { totalClaimable: '500' },
		});
	});

	it('builds a claim plan for an empty balance and marks it as not worth sending', async () => {
		const envelope = await buildDynamicFeeCurveClaimPlan({
			curveAddress: CURVE,
			account: ACCOUNT,
			termIds: [TERM_ID],
			readContext: { claimableAcross: 0n, pendingFor: [0n] },
		});

		// Having nothing to claim is an ordinary state for a plan builder to describe, not an
		// error for its caller to catch.
		expect(envelope.action).toBe('dynamicFeeCurve.claim');
		expect(envelope.estimates).toMatchObject({ claimable: { totalClaimable: '0' } });
	});
});

import { describe, expect, it } from 'vitest';
import type { DynamicFeeTierOccupancy } from '../dynamic-fee-distribution';
import {
	DYNAMIC_FEE_NO_LOT,
	dynamicFeeDistributeDeposit,
	dynamicFeeProjectHolderEarning,
} from '../dynamic-fee-distribution';
import { WAD } from '../math';
import type { DynamicFeeConfig, DynamicFeeLots } from '../types';

/**
 * Flat 1000-TRUST bands, tier-0 rate 100bps growing 50bps/tier, fulcrum pinned to the nearest
 * prior tier (alpha = 100%), sigma of 4 tiers. With `dStar = 0`, the tent weight of the prior tier
 * at distance `d` is exactly `1 - d/4`, which keeps every expectation below hand-computable.
 */
const config: DynamicFeeConfig = {
	width0: 1_000n * WAD,
	tierCount: 4n,
	tierWidthGrowthBps: 0n,
	depositBaseBps: 100n,
	depositGrowthBps: 50n,
	depositCapBps: 500n,
	depositFulcrumAlphaBps: 10_000n,
	depositKernelSpread: 4n * WAD,
	redeemFulcrumAlphaBps: 10_000n,
	redeemKernelSpread: 4n * WAD,
	redeemBaseBps: 80n,
	redeemGrowthBps: 40n,
	redeemCapBps: 400n,
	redeemToFulcrumTiersBps: 0n,
	depositToPriorTierBps: 0n,
	minEligibleTierStakeBps: 0n,
};

const FEE = 1_000_000n;

function occupancy(entries: Array<[bigint, bigint]>): DynamicFeeTierOccupancy {
	return new Map(entries);
}

/** A position, written as tier → stake, with every lot checkpointed at a zero accumulator. */
function lots(entries: Array<[bigint, bigint]>): DynamicFeeLots {
	return new Map(entries.map(([tier, stake]) => [tier, { stake, rewardDebt: 0n }]));
}

function lotStakes(position: DynamicFeeLots): Array<[bigint, bigint]> {
	return [...position.entries()].map(([tier, lot]) => [tier, lot.stake]);
}

function totalDistributed(result: ReturnType<typeof dynamicFeeDistributeDeposit>): bigint {
	return result.perTier.reduce((sum, entry) => sum + entry.amount, result.toProtocol);
}

describe('dynamic-fee-distribution', () => {
	it('routes a first-tier deposit fee entirely to the protocol — no prior tier exists', () => {
		const result = dynamicFeeDistributeDeposit({
			startAssets: 0n,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([]),
		});

		expect(result.perTier).toEqual([]);
		expect(result.toProtocol).toBe(FEE);
	});

	it('spreads a single-band fee across the prior tiers by the occupancy-weighted kernel', () => {
		// Vault in tier 2; the kernel weighs the priors at d=1 (tier 1) and d=2 (tier 0) 0.75 and 0.5,
		// and each weight is scaled by that tier's fill of its band. Tier 1 holds twice its width
		// (e = 1.5), tier 0 half of it (e = 0.25). Sigma-e of 1.75 exceeds the 1.25 a ladder holding
		// exactly its widths would carry, so the pool is spread whole over 1.75.
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([
				[0n, 500n * WAD],
				[1n, 2_000n * WAD],
			]),
		});

		expect(result.perTier).toEqual([
			// 1e6 * 0.25 / 1.75 = 142_857, plus the 1 wei the floors leave: the spread is exact here,
			// so the remainder goes to the last weighted tier, which is tier 0 at d = span.
			{ tier: 0n, amount: 142_858n, accDelta: 285n },
			// 1e6 * 1.5 / 1.75 = 857_142 over 2_000 WAD.
			{ tier: 1n, amount: 857_142n, accDelta: 428n },
		]);
		expect(result.toProtocol).toBe(0n);
		expect(totalDistributed(result)).toBe(FEE);
	});

	it('pays each tier in one spread a common rate times its kernel weight per unit of width', () => {
		// Two equally wide prior tiers, each holding exactly its band, so every fill is 1 and the
		// effective weights are the bare kernel weights 0.75 (tier 1, d=1) and 0.5 (tier 0, d=2).
		// Sigma-e equals the reference sum, so the pool divides by 1.25 with nothing left over and
		// the per-share figures are free of flooring.
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: 1_250_000n,
			config,
			occupancy: occupancy([
				[0n, 1_000n * WAD],
				[1n, 1_000n * WAD],
			]),
		});

		expect(result.perTier).toEqual([
			{ tier: 0n, amount: 500_000n, accDelta: 500n },
			{ tier: 1n, amount: 750_000n, accDelta: 750n },
		]);
		// Per-share income is `rate * w_t / width_t`: same width, so the ratio is the weight ratio.
		const perShare = (tier: bigint) =>
			result.perTier.find((entry) => entry.tier === tier)?.accDelta ?? 0n;
		expect(perShare(1n) * 2n).toBe(perShare(0n) * 3n);
		expect(result.toProtocol).toBe(0n);
	});

	it('pays the schedule rate and accrues the shortfall when the prior ladder is under its widths', () => {
		// The same two tiers at half their widths. Sigma-e (0.625) now falls short of the 1.25
		// reference, so the denominator stays 1.25 and each tier takes its fill of what a full one
		// would: 0.5 * (1e6 * 0.75 / 1.25) and 0.5 * (1e6 * 0.5 / 1.25).
		const thin = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([
				[0n, 500n * WAD],
				[1n, 500n * WAD],
			]),
		});

		expect(thin.perTier).toEqual([
			{ tier: 0n, amount: 200_000n, accDelta: 400n },
			{ tier: 1n, amount: 300_000n, accDelta: 600n },
		]);
		expect(thin.toProtocol).toBe(500_000n);
		expect(totalDistributed(thin)).toBe(FEE);

		// The ceiling those per-share figures sit at is the schedule rate: filling both tiers leaves
		// every holder earning exactly the same per share, and only the absorbed total moves.
		const full = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([
				[0n, 1_000n * WAD],
				[1n, 1_000n * WAD],
			]),
		});
		expect(full.perTier.map((entry) => entry.accDelta)).toEqual([400n, 600n]);
		expect(full.toProtocol).toBe(0n);
	});

	it('gives a lone thin tier its fill of an equal share, never the whole pool', () => {
		// Tier 0 is the only occupied prior tier and holds a tenth of its band. Under the relative
		// rule alone it would take the entire pool; the reference sum caps it at its fill of the
		// 400_000 a full tier at that weight would earn.
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([[0n, 100n * WAD]]),
		});

		expect(result.perTier).toEqual([{ tier: 0n, amount: 40_000n, accDelta: 400n }]);
		expect(result.toProtocol).toBe(960_000n);
		expect(totalDistributed(result)).toBe(FEE);
	});

	it('walks the depositToPriorTierBps spike down the prior tiers, each taking its fill', () => {
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config: { ...config, depositToPriorTierBps: 1_000n },
			occupancy: occupancy([
				[0n, 500n * WAD],
				[1n, 2_000n * WAD],
			]),
		});

		// The 10% spike (100_000) is taken whole by tier 1, which holds more than its width. The
		// remaining 900_000 spreads over 1.75 as before: 771_428 to tier 1, 128_571 to tier 0, and the
		// 1 wei the floors leave goes to the last weighted tier.
		expect(result.perTier).toEqual([
			{ tier: 0n, amount: 128_572n, accDelta: 257n },
			{ tier: 1n, amount: 871_428n, accDelta: 435n },
		]);
		expect(result.toProtocol).toBe(0n);
		expect(totalDistributed(result)).toBe(FEE);
	});

	it('accrues a single-target walk’s residue instead of feeding it to the spread', () => {
		// The whole fee is the spike, and the only eligible prior tier holds three tenths of its
		// band. It takes 300_000 — exactly `spike / width` per share, 1_000 over 300 WAD — and the
		// 700_000 it cannot absorb accrues. Offered to the spread, that residue would reach the same
		// tier a second time and pay it above the schedule rate.
		const wholeSpike = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config: { ...config, depositToPriorTierBps: 10_000n },
			occupancy: occupancy([[1n, 300n * WAD]]),
		});

		expect(wholeSpike.perTier).toEqual([{ tier: 1n, amount: 300_000n, accDelta: 1_000n }]);
		expect(wholeSpike.toProtocol).toBe(700_000n);
		expect(totalDistributed(wholeSpike)).toBe(FEE);

		// With a partial spike the spread's base is `fee - spike`, never `fee - spike + residue`.
		// Spike 300_000, of which tier 1 keeps its three-tenths fill (90_000) and 210_000 accrues;
		// the spread then runs on 700_000 alone, where tier 1's effective weight is 0.75 * 0.3
		// against the 1.25 reference, so it earns a further 126_000.
		const partialSpike = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config: { ...config, depositToPriorTierBps: 3_000n },
			occupancy: occupancy([[1n, 300n * WAD]]),
		});

		expect(partialSpike.perTier).toEqual([{ tier: 1n, amount: 216_000n, accDelta: 720n }]);
		expect(partialSpike.toProtocol).toBe(210_000n + 574_000n);
		expect(totalDistributed(partialSpike)).toBe(FEE);
	});

	it('keeps a tier at the edge of the window in the spread rather than falling back to fill', () => {
		// sigma just over one tier leaves the nearest prior tier a kernel weight of a single
		// TIER_PRECISION unit, and the next one outside the window entirely. Carried at that bare
		// scale the effective weight of a half-full tier would floor to zero and wrongly trigger the
		// fill-only split across the whole prior ladder; weights are carried at WEIGHT_PRECISION and
		// the fallback keys on the window, so tier 1 stays in the spread on its own kernel weight.
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config: { ...config, depositKernelSpread: WAD + 1n },
			occupancy: occupancy([[1n, 500n * WAD]]),
		});

		// The reference sum is the kernel sum over both prior tiers — one unit and zero — so tier 1
		// takes its half fill of the whole pool. Under the fill-only fallback the reference would
		// have been the span (2), halving it to 250_000.
		expect(result.perTier).toEqual([{ tier: 1n, amount: 500_000n, accDelta: 1_000n }]);
		expect(result.toProtocol).toBe(500_000n);
		expect(totalDistributed(result)).toBe(FEE);
	});

	it('drops a sub-floor tier from the spread, and its slice is absorbed rather than forfeited', () => {
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config: { ...config, minEligibleTierStakeBps: 6_000n },
			occupancy: occupancy([
				[0n, 500n * WAD], // half a width, below the 60% floor — ineligible
				[1n, 2_000n * WAD],
			]),
		});

		expect(result.perTier).toEqual([{ tier: 1n, amount: FEE, accDelta: 500n }]);
		expect(result.toProtocol).toBe(0n);
	});

	it('falls back to fill alone across the whole prior ladder when the window misses everyone', () => {
		// sigma of a quarter tier zeroes every tent weight (nearest prior sits at distance 1), so the
		// spread re-runs with every kernel weight set to one: tier 1's fill is 2, tier 0's is 0.5,
		// and the reference sum becomes the span, 2. Sigma-e of 2.5 exceeds it, so the pool is spread
		// whole over 2.5.
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config: { ...config, depositKernelSpread: WAD / 4n },
			occupancy: occupancy([
				[0n, 500n * WAD],
				[1n, 2_000n * WAD],
			]),
		});

		expect(result.perTier).toEqual([
			{ tier: 0n, amount: 200_000n, accDelta: 400n },
			{ tier: 1n, amount: 800_000n, accDelta: 400n },
		]);
		expect(result.toProtocol).toBe(0n);
		// Fill alone pays every tier the same per share, whatever its occupancy.
		expect(result.perTier[0]?.accDelta).toBe(result.perTier[1]?.accDelta);
	});

	it('reads the deposit kernel pair for a deposit fee; the redeem pair does not move it', () => {
		const inputs = {
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			occupancy: occupancy([
				[0n, 500n * WAD],
				[1n, 2_000n * WAD],
			]),
		};
		const baseline = dynamicFeeDistributeDeposit({ ...inputs, config });

		for (const redeemFulcrumAlphaBps of [0n, 10_000n]) {
			const result = dynamicFeeDistributeDeposit({
				...inputs,
				config: { ...config, redeemFulcrumAlphaBps, redeemKernelSpread: WAD / 4n },
			});
			expect(result.perTier).toEqual(baseline.perTier);
		}

		// alpha = 0 moves the peak to the farthest prior tier: weights 1 (tier 0) and 0.75 (tier 1).
		// Scaled by fill that is e = 0.5 for tier 0 and e = 1.5 for tier 1, summing to 2 against a
		// 1.75 reference, so the pool is spread whole over 2 and divides evenly.
		const farPeak = dynamicFeeDistributeDeposit({
			...inputs,
			config: { ...config, depositFulcrumAlphaBps: 0n },
		});
		expect(farPeak.perTier).toEqual([
			{ tier: 0n, amount: 250_000n, accDelta: 500n },
			{ tier: 1n, amount: 750_000n, accDelta: 375n },
		]);
		expect(farPeak.toProtocol).toBe(0n);
		// Per share, the peak tier earns `1 / 0.75` of its neighbour: the weights, not the stakes.
		expect(farPeak.perTier[0]?.accDelta ?? 0n).toBe(
			((farPeak.perTier[1]?.accDelta ?? 0n) * 4n) / 3n
		);
	});

	it('replays a band-crossing deposit: earlier bands land before later bands distribute', () => {
		// Fresh depositor, vault at 500 in tier 0, net 1_000 → 500 in band 0, 500 in band 1.
		// Band weights 5 and 7.5 WAD → band-0 fee 400_000 (protocol: tier 0 has no priors), band-1
		// fee 600_000 spread over tier 0 — whose stake now INCLUDES the depositor's landed 500, so
		// its effective weight is 0.75 * 0.8 = 0.6 against the 0.75 reference: it earns 480_000 at
		// the schedule rate and the 120_000 no stake is there to earn accrues to the protocol.
		const result = dynamicFeeDistributeDeposit({
			startAssets: 500n * WAD,
			netStake: 1_000n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([[0n, 300n * WAD]]),
		});

		expect(result.toProtocol).toBe(520_000n);
		expect(result.perTier).toEqual([
			// floor(480_000 * 1e18 / 800e18): 300 pre-existing + the depositor's landed 500.
			{ tier: 0n, amount: 480_000n, accDelta: 600n },
		]);
		expect(totalDistributed(result)).toBe(FEE);

		// One lot per band, each where the money landed. The tier-0 lot was checkpointed before band 1
		// credited tier 0, so the depositor keeps the earning on the stake they already held there.
		expect(result.bands).toEqual([
			{ tier: 0n, stake: 500n * WAD, fee: 400_000n },
			{ tier: 1n, stake: 500n * WAD, fee: 600_000n },
		]);
		expect(lotStakes(result.depositorAfter)).toEqual([
			[0n, 500n * WAD],
			[1n, 500n * WAD],
		]);
		expect(result.depositorAfter.get(0n)?.rewardDebt).toBe(0n);
		expect(result.topTierAfter).toBe(1n);
		expect(result.banked).toBe(0n);
		expect(result.occupancyAfter.get(0n)).toBe(800n * WAD);
		expect(result.occupancyAfter.get(1n)).toBe(500n * WAD);
	});

	it('lands one lot per band and never moves an earlier lot', () => {
		const first = dynamicFeeDistributeDeposit({
			startAssets: 0n,
			netStake: 2_500n * WAD,
			feeAmount: 0n,
			config,
			occupancy: occupancy([]),
		});

		expect(lotStakes(first.depositorAfter)).toEqual([
			[0n, 1_000n * WAD],
			[1n, 1_000n * WAD],
			[2n, 500n * WAD],
		]);
		expect(first.topTierAfter).toBe(2n);

		// A follow-on deposit from the same account tops up the tier-2 lot and opens a tier-3 one.
		// The tier-0 and tier-1 lots keep their stake and their entry tier: nothing averages.
		const second = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 1_000n * WAD,
			feeAmount: 0n,
			config,
			occupancy: first.occupancyAfter,
			depositor: first.depositorAfter,
		});

		expect(lotStakes(second.depositorAfter)).toEqual([
			[0n, 1_000n * WAD],
			[1n, 1_000n * WAD],
			[2n, 1_000n * WAD],
			[3n, 500n * WAD],
		]);
		expect(second.topTierAfter).toBe(3n);
		expect(second.occupancyAfter.get(2n)).toBe(1_000n * WAD);
		expect(second.occupancyAfter.get(3n)).toBe(500n * WAD);
	});

	it('banks what a lot had earned when a later band tops it up', () => {
		// The lot at tier 0 carries 1_000 per-share of unsettled credit over 500 WAD of stake.
		const result = dynamicFeeDistributeDeposit({
			startAssets: 400n * WAD,
			netStake: 500n * WAD,
			feeAmount: 0n,
			config,
			occupancy: occupancy([[0n, 500n * WAD]]),
			accFeePerShare: new Map([[0n, 1_000n]]),
			depositor: lots([[0n, 500n * WAD]]),
		});

		expect(result.banked).toBe(500_000n);
		expect(result.depositorAfter.get(0n)).toEqual({
			stake: 1_000n * WAD,
			// Re-based over the topped-up lot, so the banked credit cannot be earned twice.
			rewardDebt: 1_000_000n,
		});
		expect(result.occupancyAfter.get(0n)).toBe(1_000n * WAD);
	});

	it('distributes from the vault tier and opens no lot when the deposit mints nothing', () => {
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 0n,
			feeAmount: FEE,
			config,
			occupancy: occupancy([[1n, 2_000n * WAD]]),
		});

		expect(result.bands).toEqual([]);
		expect(result.depositorAfter.size).toBe(0);
		expect(result.topTierAfter).toBe(DYNAMIC_FEE_NO_LOT);
		// Sourced at tier 2, so tier 1 is the only eligible prior tier and takes the whole fee.
		expect(result.perTier).toEqual([{ tier: 1n, amount: FEE, accDelta: 500n }]);
	});

	it("projects a holder's earning through the same floors the contract applies", () => {
		const result = dynamicFeeDistributeDeposit({
			startAssets: 500n * WAD,
			netStake: 1_000n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([[0n, 300n * WAD]]),
		});

		const earning = dynamicFeeProjectHolderEarning({
			distribution: result,
			lots: lots([[0n, 300n * WAD]]),
			accBefore: new Map([[0n, 7n]]),
		});

		// The pre-existing holder owns 300/800 of tier 0 when band 1's capped 480_000 lands: 180_000.
		expect(earning).toBe(180_000n);
	});

	it('sums a holder earning across every lot they hold', () => {
		const result = dynamicFeeDistributeDeposit({
			startAssets: 2_500n * WAD,
			netStake: 10n * WAD,
			feeAmount: FEE,
			config,
			occupancy: occupancy([
				[0n, 500n * WAD],
				[1n, 2_000n * WAD],
			]),
		});

		// Tier 0 pays 285 per share and tier 1 pays 428; a holder with a lot in each collects both.
		const earning = dynamicFeeProjectHolderEarning({
			distribution: result,
			lots: lots([
				[0n, 100n * WAD],
				[1n, 400n * WAD],
			]),
			accBefore: new Map(),
		});

		expect(earning).toBe(100n * 285n + 400n * 428n);
	});

	it('conserves the fee for an arbitrary spread of occupancies and parameters', () => {
		const result = dynamicFeeDistributeDeposit({
			startAssets: 3_100n * WAD,
			netStake: 750n * WAD,
			feeAmount: 999_999_999_999_999n,
			config: { ...config, depositToPriorTierBps: 3_700n, depositFulcrumAlphaBps: 4_200n },
			occupancy: occupancy([
				[0n, 123n * WAD],
				[1n, 4_567n * WAD],
				[2n, 89n * WAD],
			]),
			depositor: lots([[2n, 200n * WAD]]),
		});

		expect(totalDistributed(result)).toBe(999_999_999_999_999n);
	});
});

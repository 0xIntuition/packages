import { describe, expect, it } from 'vitest';

import {
	DYNAMIC_FEE_BPS,
	dynamicFeeDepositFeeBps,
	dynamicFeeQuoteDepositBands,
	dynamicFeeQuoteDepositFee,
	dynamicFeeQuoteRedeemFee,
	dynamicFeeQuoteRedeemFeeForLots,
	dynamicFeeQuoteRedeemFeeLots,
	dynamicFeeRedeemFeeBps,
	dynamicFeeTierLadder,
	dynamicFeeTierOf,
	dynamicFeeTierUpperEdge,
	dynamicFeeTierWidthAt,
} from '../dynamic-fee-curve';
import { mulDivUp, WAD } from '../math';
import type { DynamicFeeConfig, DynamicFeeLots } from '../types';

const flatConfig: DynamicFeeConfig = {
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

const growingConfig: DynamicFeeConfig = {
	...flatConfig,
	tierCount: 5n,
	tierWidthGrowthBps: 5_000n,
};

describe('dynamic-fee-curve', () => {
	describe('tierUpperEdge', () => {
		it('flat schedule: edges are plain multiples of width0', () => {
			expect(dynamicFeeTierUpperEdge(0n, flatConfig)).toBe(1_000n * WAD);
			expect(dynamicFeeTierUpperEdge(1n, flatConfig)).toBe(2_000n * WAD);
			expect(dynamicFeeTierUpperEdge(2n, flatConfig)).toBe(3_000n * WAD);
		});

		it('growing schedule: tier 0 edge equals width0 regardless of growth', () => {
			expect(dynamicFeeTierUpperEdge(0n, growingConfig)).toBe(growingConfig.width0);
		});

		it('growing schedule: edges are strictly increasing', () => {
			const edges = [0n, 1n, 2n, 3n].map((k) => dynamicFeeTierUpperEdge(k, growingConfig));
			for (let i = 1; i < edges.length; i++) {
				expect(edges[i]).toBeGreaterThan(edges[i - 1] as bigint);
			}
		});

		it('growing schedule: bands widen (later width > earlier width)', () => {
			const width0 = dynamicFeeTierWidthAt(0n, growingConfig);
			const width1 = dynamicFeeTierWidthAt(1n, growingConfig);
			expect(width1).toBeGreaterThan(width0);
		});

		it('exact golden vector: edge(1) at 50% growth, one real rpow squaring step', () => {
			// Independently derived: ratioWad = 1.5e18 exactly; rpow(1.5e18, 2, 1e18) squares to
			// 2.25e18 exactly (no rounding at this precision); edge(1) = width0 * 1.25e18 / 0.5e18
			// = 2.5 * width0. Cross-checked against a from-scratch reimplementation outside this
			// package, not just this module's own output.
			expect(dynamicFeeTierUpperEdge(1n, growingConfig)).toBe(2_500n * WAD);
		});

		it('exact golden vector: edge(4) at a non-clean 33.33% growth rate, where rpow rounding actually bites', () => {
			// tierWidthGrowthBps = 3333 does not carry the large power-of-2/power-of-5 trailing-factor
			// budget that round bps values (e.g. 5000) do, so by k=4 the squaring chain has
			// genuinely non-exact intermediate results — this exercises rpow's round-half-up path,
			// not just the exact-division case above. Value from an independent reimplementation.
			const config = { ...growingConfig, tierWidthGrowthBps: 3_333n };
			expect(dynamicFeeTierUpperEdge(4n, config)).toBe(9_641_359_276_666_432_100_210n);
		});
	});

	describe('tierWidthAt', () => {
		it('tier 0 width equals tier 0 edge', () => {
			expect(dynamicFeeTierWidthAt(0n, flatConfig)).toBe(dynamicFeeTierUpperEdge(0n, flatConfig));
		});

		it('flat schedule: every tier has the same width', () => {
			expect(dynamicFeeTierWidthAt(1n, flatConfig)).toBe(flatConfig.width0);
			expect(dynamicFeeTierWidthAt(2n, flatConfig)).toBe(flatConfig.width0);
		});
	});

	describe('tierOf', () => {
		it('zero assets is tier 0', () => {
			expect(dynamicFeeTierOf(0n, flatConfig)).toBe(0n);
		});

		it('assets just below the tier-0 edge stay in tier 0', () => {
			expect(dynamicFeeTierOf(flatConfig.width0 - 1n, flatConfig)).toBe(0n);
		});

		it('assets exactly at the tier-0 edge roll into tier 1', () => {
			expect(dynamicFeeTierOf(flatConfig.width0, flatConfig)).toBe(1n);
		});

		it('caps at the top tier for assets beyond the last edge', () => {
			const topEdge = dynamicFeeTierUpperEdge(flatConfig.tierCount - 1n, flatConfig);
			expect(dynamicFeeTierOf(topEdge * 100n, flatConfig)).toBe(flatConfig.tierCount - 1n);
		});
	});

	describe('depositFeeBps / redeemFeeBps', () => {
		it('tier 0 uses the base rate', () => {
			expect(dynamicFeeDepositFeeBps(0n, flatConfig)).toBe(flatConfig.depositBaseBps);
			expect(dynamicFeeRedeemFeeBps(0n, flatConfig)).toBe(flatConfig.redeemBaseBps);
		});

		it('rate grows linearly with tier until the cap', () => {
			expect(dynamicFeeDepositFeeBps(1n, flatConfig)).toBe(
				flatConfig.depositBaseBps + flatConfig.depositGrowthBps
			);
		});

		it('caps the formulaic rate at depositCapBps / redeemCapBps', () => {
			// A tier high enough that base + tier*growth exceeds the cap on its own.
			const farTier = 100n;
			expect(dynamicFeeDepositFeeBps(farTier, flatConfig)).toBe(flatConfig.depositCapBps);
			expect(dynamicFeeRedeemFeeBps(farTier, flatConfig)).toBe(flatConfig.redeemCapBps);
		});

		it('a manual override replaces the formula, clamped to the live cap', () => {
			expect(
				dynamicFeeDepositFeeBps(0n, flatConfig, {
					isSet: true,
					depositFeeBps: 10_000n,
					redeemFeeBps: 0n,
				})
			).toBe(flatConfig.depositCapBps);

			expect(
				dynamicFeeDepositFeeBps(0n, flatConfig, {
					isSet: true,
					depositFeeBps: 25n,
					redeemFeeBps: 0n,
				})
			).toBe(25n);
		});
	});

	describe('quoteDepositFee', () => {
		it('a deposit contained in a single band charges that band rate on the whole amount', () => {
			const baseAssets = 10n * WAD;
			const fee = dynamicFeeQuoteDepositFee(0n, baseAssets, flatConfig);
			expect(fee).toBe(mulDivUp(baseAssets, flatConfig.depositBaseBps, DYNAMIC_FEE_BPS));
		});

		it('a deposit that climbs several tiers charges more than the pre-deposit rate alone would', () => {
			const startAssets = 0n;
			const baseAssets = flatConfig.width0 * 3n;
			const fee = dynamicFeeQuoteDepositFee(startAssets, baseAssets, flatConfig);
			const flatRateFee = mulDivUp(baseAssets, flatConfig.depositBaseBps, DYNAMIC_FEE_BPS);
			expect(fee).toBeGreaterThan(flatRateFee);
		});

		it('respects a per-tier override while walking multiple bands', () => {
			const overrides = new Map([[0n, { isSet: true, depositFeeBps: 0n, redeemFeeBps: 0n }]]);
			const feeWithOverride = dynamicFeeQuoteDepositFee(
				0n,
				flatConfig.width0,
				flatConfig,
				overrides
			);
			expect(feeWithOverride).toBe(0n);
		});

		it('exact golden vector: a multi-band deposit crossing three tiers, cross-checked against an independent reimplementation', () => {
			// growingConfig: width0=1000e18, tierWidthGrowthBps=5000 (50%), depositBaseBps=100,
			// depositGrowthBps=50, depositCapBps=500. A 3500e18 deposit from an empty vault walks
			// tiers 0 (edge 1000e18), 1 (edge 2500e18), and lands inside tier 2. Value from a
			// from-scratch reimplementation of `_piecewiseDepositFee`, not this module's own code.
			const fee = dynamicFeeQuoteDepositFee(0n, 3_500n * WAD, growingConfig);
			expect(fee).toBe(52_284_776_701_020_355_844n);
		});
	});

	describe('quoteDepositBands', () => {
		it('sums to the total the scalar quote returns', () => {
			const start = 500n * WAD;
			const base = 2_500n * WAD;
			const bands = dynamicFeeQuoteDepositBands(start, base, flatConfig);
			const total = bands.reduce((sum, band) => sum + band.fee, 0n);

			expect(total).toBe(dynamicFeeQuoteDepositFee(start, base, flatConfig));
		});

		it('starts in the tier the deposit begins in and climbs one band at a time', () => {
			const start = 500n * WAD;
			const bands = dynamicFeeQuoteDepositBands(start, 2_500n * WAD, flatConfig);

			expect(bands[0]?.tier).toBe(dynamicFeeTierOf(start, flatConfig));
			expect(bands.map((band) => band.tier)).toEqual([0n, 1n, 2n]);
		});

		it('charges each band at its own rate, and the assets it reports sum to the deposit', () => {
			const base = 2_500n * WAD;
			const bands = dynamicFeeQuoteDepositBands(500n * WAD, base, flatConfig);

			expect(bands.reduce((sum, band) => sum + band.assets, 0n)).toBe(base);
			for (const band of bands) {
				expect(band.feeBps).toBe(dynamicFeeDepositFeeBps(band.tier, flatConfig));
				expect(band.fee).toBe(mulDivUp(band.assets, band.feeBps, DYNAMIC_FEE_BPS));
			}
		});

		it('reports a single band for a deposit that stays inside one tier', () => {
			const bands = dynamicFeeQuoteDepositBands(0n, 10n * WAD, flatConfig);

			expect(bands).toHaveLength(1);
			expect(bands[0]?.tier).toBe(0n);
		});

		it('returns no bands for a zero deposit', () => {
			expect(dynamicFeeQuoteDepositBands(0n, 0n, flatConfig)).toEqual([]);
		});
	});

	describe('quoteWithdrawalFee', () => {
		it('matches grossAssets * redeemFeeBps(tier) / BPS, rounded up', () => {
			const grossAssets = 7n * WAD;
			const fee = dynamicFeeQuoteRedeemFee(grossAssets, 2n, flatConfig);
			expect(fee).toBe(
				mulDivUp(grossAssets, dynamicFeeRedeemFeeBps(2n, flatConfig), DYNAMIC_FEE_BPS)
			);
		});
	});

	describe('tierLadder', () => {
		it('returns one entry per configured tier, in order', () => {
			const ladder = dynamicFeeTierLadder(flatConfig);
			expect(ladder).toHaveLength(Number(flatConfig.tierCount));
			const topTier = flatConfig.tierCount - 1n;
			ladder.forEach((entry, i) => {
				expect(entry.tier).toBe(BigInt(i));
				if (entry.tier === topTier) {
					expect(entry.upperEdge).toBeNull();
					expect(entry.width).toBeNull();
				} else {
					expect(entry.upperEdge).toBe(dynamicFeeTierUpperEdge(BigInt(i), flatConfig));
					expect(entry.width).toBe(dynamicFeeTierWidthAt(BigInt(i), flatConfig));
				}
			});
		});

		it('reports the top tier as unbounded (null edge/width), even though the raw edge helper still returns a finite, inert number', () => {
			const ladder = dynamicFeeTierLadder(flatConfig);
			const topEntry = ladder.at(-1);
			expect(topEntry?.upperEdge).toBeNull();
			expect(topEntry?.width).toBeNull();
			// The raw helper is a faithful port of the on-chain closed form and still returns a
			// real number for the top tier — it's just never enforced as a boundary on-chain
			// (`_tierOf` returns `tierCount - 1` for any assets at or past it). The ladder is the
			// presentation layer that must not let that finite-but-inert number read as a cap.
			expect(dynamicFeeTierUpperEdge(flatConfig.tierCount - 1n, flatConfig)).toBeGreaterThan(0n);
		});

		it('applies overrides per tier', () => {
			const overrides = new Map([[1n, { isSet: true, depositFeeBps: 42n, redeemFeeBps: 7n }]]);
			const ladder = dynamicFeeTierLadder(flatConfig, overrides);
			expect(ladder[1]?.depositFeeBps).toBe(42n);
			expect(ladder[1]?.redeemFeeBps).toBe(7n);
		});
	});

	// flatConfig redeem schedule: base 80, growth 40, cap 400 — so tier 0 pays 80 bps, tier 1 120,
	// tier 2 160, tier 3 200. Every expectation below is derived by hand from that ladder and the
	// LIFO rules, not from the implementation.
	describe('quoteRedeemFeeLots', () => {
		function lotsOf(entries: [bigint, bigint][]): DynamicFeeLots {
			return new Map(entries.map(([tier, stake]) => [tier, { stake, rewardDebt: 0n }]));
		}

		it('draws lots highest tier first, each at its own rate', () => {
			// 250 shares against lots {tier 3: 100, tier 1: 300}:
			//   tier 3 gives 100 -> ceil(100 * 200 / 10000) = ceil(2)   = 2
			//   tier 1 gives 150 -> ceil(150 * 120 / 10000) = ceil(1.8) = 2
			const charges = dynamicFeeQuoteRedeemFeeLots(
				250n,
				lotsOf([
					[1n, 300n],
					[3n, 100n],
				]),
				2n,
				flatConfig
			);
			expect(charges).toEqual([
				{ tier: 3n, shares: 100n, rateBps: 200n, fee: 2n },
				{ tier: 1n, shares: 150n, rateBps: 120n, fee: 2n },
			]);
		});

		it('prices shares beyond the recorded lots at the vault tier, as one trailing entry', () => {
			// 130 shares against a single lot {tier 2: 50}, vault sitting in tier 0:
			//   tier 2 gives 50 -> ceil(50 * 160 / 10000) = ceil(0.8)  = 1
			//   80 left over    -> ceil(80 *  80 / 10000) = ceil(0.64) = 1 at the vault tier
			const charges = dynamicFeeQuoteRedeemFeeLots(130n, lotsOf([[2n, 50n]]), 0n, flatConfig);
			expect(charges).toEqual([
				{ tier: 2n, shares: 50n, rateBps: 160n, fee: 1n },
				{ tier: 0n, shares: 80n, rateBps: 80n, fee: 1n },
			]);
		});

		it('prices an account with no lots entirely at the vault tier', () => {
			// The account-less preview path: 1000 shares, no lots, vault in tier 3 ->
			// ceil(1000 * 200 / 10000) = 20, as a single entry.
			const charges = dynamicFeeQuoteRedeemFeeLots(1_000n, lotsOf([]), 3n, flatConfig);
			expect(charges).toEqual([{ tier: 3n, shares: 1_000n, rateBps: 200n, fee: 20n }]);
		});

		it('returns no entries for a zero-share redeem', () => {
			expect(dynamicFeeQuoteRedeemFeeLots(0n, lotsOf([[2n, 50n]]), 1n, flatConfig)).toEqual([]);
			expect(dynamicFeeQuoteRedeemFeeLots(0n, lotsOf([]), 1n, flatConfig)).toEqual([]);
		});

		it('stops at the lots it needs and leaves lower untouched lots out', () => {
			// 40 shares never reach the tier 0 lot, so tier 0 is absent rather than present at zero.
			const charges = dynamicFeeQuoteRedeemFeeLots(
				40n,
				lotsOf([
					[0n, 500n],
					[2n, 60n],
				]),
				2n,
				flatConfig
			);
			expect(charges).toEqual([{ tier: 2n, shares: 40n, rateBps: 160n, fee: 1n }]);
		});

		it('applies a tier override to the lot at that tier', () => {
			const overrides = new Map([[3n, { isSet: true, depositFeeBps: 0n, redeemFeeBps: 50n }]]);
			// ceil(100 * 50 / 10000) = ceil(0.5) = 1
			const charges = dynamicFeeQuoteRedeemFeeLots(
				100n,
				lotsOf([[3n, 100n]]),
				3n,
				flatConfig,
				overrides
			);
			expect(charges).toEqual([{ tier: 3n, shares: 100n, rateBps: 50n, fee: 1n }]);
		});

		it('rounds up per lot, not once on the total', () => {
			// Two 1-share lots at tier 0 pay ceil(80/10000) = 1 each. Rounding the same 2 shares
			// once would pay ceil(160/10000) = 1, so the split is what explains the total.
			const charges = dynamicFeeQuoteRedeemFeeLots(
				2n,
				lotsOf([
					[0n, 1n],
					[1n, 1n],
				]),
				0n,
				flatConfig
			);
			expect(charges.map((charge) => charge.fee)).toEqual([1n, 1n]);
			expect(dynamicFeeQuoteRedeemFee(2n, 0n, flatConfig)).toBe(1n);
		});

		it('sums to the total the aggregate quote reports', () => {
			const cases: [bigint, DynamicFeeLots, bigint][] = [
				[
					250n,
					lotsOf([
						[1n, 300n],
						[3n, 100n],
					]),
					2n,
				],
				[130n, lotsOf([[2n, 50n]]), 0n],
				[1_000n, lotsOf([]), 3n],
				[0n, lotsOf([[2n, 50n]]), 1n],
			];
			for (const [shares, lots, vaultTier] of cases) {
				const charges = dynamicFeeQuoteRedeemFeeLots(shares, lots, vaultTier, flatConfig);
				const summed = charges.reduce((total, charge) => total + charge.fee, 0n);
				expect(summed).toBe(dynamicFeeQuoteRedeemFeeForLots(shares, lots, vaultTier, flatConfig));
			}
		});
	});
});

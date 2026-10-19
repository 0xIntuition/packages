import { describe, expect, it } from 'vitest';

import {
	DYNAMIC_FEE_BPS,
	dynamicFeeDepositFeeBps,
	dynamicFeeQuoteDepositFee,
	dynamicFeeQuoteWithdrawalFee,
	dynamicFeeTierLadder,
	dynamicFeeTierOf,
	dynamicFeeTierUpperEdge,
	dynamicFeeTierWidthAt,
	dynamicFeeWithdrawalFeeBps,
} from '../dynamic-fee-curve.js';
import { mulDivUp, WAD } from '../math.js';
import type { DynamicFeeConfig } from '../types.js';

const flatConfig: DynamicFeeConfig = {
	width0: 1_000n * WAD,
	tierCount: 4n,
	growthGBps: 0n,
	depositBaseBps: 100n,
	depositGrowthBps: 50n,
	depositCapBps: 500n,
	fulcrumAlpha: 10_000n,
	kernelSpread: 4n * WAD,
	withdrawalBaseBps: 80n,
	withdrawalGrowthBps: 40n,
	withdrawalCapBps: 400n,
	withdrawalToFulcrumTiersBps: 0n,
	depositToPriorTierBps: 0n,
	minEligibleTierStake: 0n,
};

const growingConfig: DynamicFeeConfig = {
	...flatConfig,
	tierCount: 5n,
	growthGBps: 5_000n,
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
			// growthGBps = 3333 does not carry the large power-of-2/power-of-5 trailing-factor
			// budget that round bps values (e.g. 5000) do, so by k=4 the squaring chain has
			// genuinely non-exact intermediate results — this exercises rpow's round-half-up path,
			// not just the exact-division case above. Value from an independent reimplementation.
			const config = { ...growingConfig, growthGBps: 3_333n };
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

	describe('depositFeeBps / withdrawalFeeBps', () => {
		it('tier 0 uses the base rate', () => {
			expect(dynamicFeeDepositFeeBps(0n, flatConfig)).toBe(flatConfig.depositBaseBps);
			expect(dynamicFeeWithdrawalFeeBps(0n, flatConfig)).toBe(flatConfig.withdrawalBaseBps);
		});

		it('rate grows linearly with tier until the cap', () => {
			expect(dynamicFeeDepositFeeBps(1n, flatConfig)).toBe(
				flatConfig.depositBaseBps + flatConfig.depositGrowthBps
			);
		});

		it('caps the formulaic rate at depositCapBps / withdrawalCapBps', () => {
			// A tier high enough that base + tier*growth exceeds the cap on its own.
			const farTier = 100n;
			expect(dynamicFeeDepositFeeBps(farTier, flatConfig)).toBe(flatConfig.depositCapBps);
			expect(dynamicFeeWithdrawalFeeBps(farTier, flatConfig)).toBe(flatConfig.withdrawalCapBps);
		});

		it('a manual override replaces the formula, clamped to the live cap', () => {
			expect(
				dynamicFeeDepositFeeBps(0n, flatConfig, {
					isSet: true,
					depositFeeBps: 10_000n,
					withdrawalFeeBps: 0n,
				})
			).toBe(flatConfig.depositCapBps);

			expect(
				dynamicFeeDepositFeeBps(0n, flatConfig, {
					isSet: true,
					depositFeeBps: 25n,
					withdrawalFeeBps: 0n,
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
			const overrides = new Map([[0n, { isSet: true, depositFeeBps: 0n, withdrawalFeeBps: 0n }]]);
			const feeWithOverride = dynamicFeeQuoteDepositFee(
				0n,
				flatConfig.width0,
				flatConfig,
				overrides
			);
			expect(feeWithOverride).toBe(0n);
		});

		it('exact golden vector: a multi-band deposit crossing three tiers, cross-checked against an independent reimplementation', () => {
			// growingConfig: width0=1000e18, growthGBps=5000 (50%), depositBaseBps=100,
			// depositGrowthBps=50, depositCapBps=500. A 3500e18 deposit from an empty vault walks
			// tiers 0 (edge 1000e18), 1 (edge 2500e18), and lands inside tier 2. Value from a
			// from-scratch reimplementation of `_piecewiseDepositFee`, not this module's own code.
			const fee = dynamicFeeQuoteDepositFee(0n, 3_500n * WAD, growingConfig);
			expect(fee).toBe(52_284_776_701_020_355_844n);
		});
	});

	describe('quoteWithdrawalFee', () => {
		it('matches grossAssets * withdrawalFeeBps(tier) / BPS, rounded up', () => {
			const grossAssets = 7n * WAD;
			const fee = dynamicFeeQuoteWithdrawalFee(grossAssets, 2n, flatConfig);
			expect(fee).toBe(
				mulDivUp(grossAssets, dynamicFeeWithdrawalFeeBps(2n, flatConfig), DYNAMIC_FEE_BPS)
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
			const overrides = new Map([[1n, { isSet: true, depositFeeBps: 42n, withdrawalFeeBps: 7n }]]);
			const ladder = dynamicFeeTierLadder(flatConfig, overrides);
			expect(ladder[1]?.depositFeeBps).toBe(42n);
			expect(ladder[1]?.withdrawalFeeBps).toBe(7n);
		});
	});
});

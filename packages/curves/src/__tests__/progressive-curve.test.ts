import { describe, expect, it } from 'vitest';

import { WAD } from '../math';
import {
	createProgressiveCurve,
	progressiveConvertToAssets,
	progressiveConvertToShares,
	progressiveCurrentPrice,
	progressivePreviewDeposit,
	progressivePreviewMint,
	progressivePreviewRedeem,
	progressivePreviewWithdraw,
} from '../progressive-curve';
import type { CurveState, ProgressiveCurveConfig } from '../types';

const E18 = WAD;

describe('progressive-curve (no offset)', () => {
	const config: ProgressiveCurveConfig = { slope: 2n * E18 };

	describe('convertToShares / convertToAssets', () => {
		it('produces positive shares for a deposit', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 3n * E18 };
			const shares = progressiveConvertToShares(4n * E18, state, config);
			expect(shares).toBeGreaterThan(0n);
		});

		it('round-trip redeem never exceeds deposited amount', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 3n * E18 };
			const assets = 4n * E18;
			const shares = progressiveConvertToShares(assets, state, config);
			const redeemed = progressiveConvertToAssets(shares, state, config);
			expect(redeemed).toBeLessThanOrEqual(assets);
		});

		it('throws when shares exceed totalShares', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: E18 };
			expect(() => progressiveConvertToAssets(2n * E18, state, config)).toThrow(
				'shares cannot exceed totalShares'
			);
		});

		it('convert matches preview for deposit', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(progressiveConvertToShares(E18, state, config)).toBe(
				progressivePreviewDeposit(E18, state, config)
			);
		});

		it('convert matches preview for redeem', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(progressiveConvertToAssets(E18, state, config)).toBe(
				progressivePreviewRedeem(E18, state, config)
			);
		});
	});

	describe('currentPrice', () => {
		it('price = totalShares * slope / WAD', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 3n * E18 };
			// 3e18 * 2e18 / 1e18 = 6e18
			expect(progressiveCurrentPrice(state, config)).toBe(6n * E18);
		});

		it('price is 0 at zero supply', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(progressiveCurrentPrice(state, config)).toBe(0n);
		});
	});

	describe('previewDeposit', () => {
		it('returns 0 shares for 0 assets', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(progressivePreviewDeposit(0n, state, config)).toBe(0n);
		});

		it('deposit from zero supply produces shares', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			const shares = progressivePreviewDeposit(E18, state, config);
			expect(shares).toBeGreaterThan(0n);
		});
	});

	describe('previewRedeem', () => {
		it('returns 0 assets for 0 shares', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(progressivePreviewRedeem(0n, state, config)).toBe(0n);
		});

		it('redeems positive assets for positive shares', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			const assets = progressivePreviewRedeem(E18, state, config);
			expect(assets).toBeGreaterThan(0n);
		});
	});

	describe('previewMint', () => {
		it('mint costs at least as much as deposit earns (rounding)', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			const shares = E18;
			const mintCost = progressivePreviewMint(shares, state, config);
			const depositResult = progressivePreviewDeposit(mintCost, state, config);
			// Deposit of mintCost should yield at most `shares` (+1 for rounding)
			expect(depositResult).toBeLessThanOrEqual(shares + 1n);
		});

		it('returns positive cost for positive shares', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			const cost = progressivePreviewMint(E18, state, config);
			expect(cost).toBeGreaterThan(0n);
		});

		it('mint from zero supply returns positive cost', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			const cost = progressivePreviewMint(E18, state, config);
			expect(cost).toBeGreaterThan(0n);
		});
	});

	describe('previewWithdraw', () => {
		it('throws when assets exceed redeemable max', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: E18,
			};
			expect(() => progressivePreviewWithdraw(10n ** 30n, state, config)).toThrow(
				'assets cannot exceed redeemable assets'
			);
		});

		it('returns positive shares for positive asset withdrawal', () => {
			const state: CurveState = {
				totalAssets: E18,
				totalShares: 10n * E18,
			};
			// First compute the max redeemable to make sure we stay within bounds
			const redeemableAssets = progressivePreviewRedeem(state.totalShares, state, config);
			// Withdraw a small amount relative to redeemable
			const withdrawAmount = redeemableAssets > E18 ? E18 : redeemableAssets / 2n;
			if (withdrawAmount > 0n) {
				const sharesToBurn = progressivePreviewWithdraw(withdrawAmount, state, config);
				expect(sharesToBurn).toBeGreaterThan(0n);
			}
		});
	});

	describe('mint-withdraw consistency', () => {
		it('withdraw rounds up: shares_to_withdraw >= mint_shares', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			const mintShares = E18;
			const assetsNeeded = progressivePreviewMint(mintShares, state, config);

			const stateAfter: CurveState = {
				totalAssets: state.totalAssets + assetsNeeded,
				totalShares: state.totalShares + mintShares,
			};
			const sharesToWithdraw = progressivePreviewWithdraw(assetsNeeded, stateAfter, config);
			expect(sharesToWithdraw).toBeGreaterThanOrEqual(mintShares);
		});
	});

	describe('round-trip invariants', () => {
		it('deposit then redeem never profits', () => {
			const depositAmount = 5n * E18;
			const states: CurveState[] = [
				{ totalAssets: 0n, totalShares: 0n },
				{ totalAssets: 0n, totalShares: 10n * E18 },
				{ totalAssets: 50n * E18, totalShares: 100n * E18 },
			];

			for (const state of states) {
				const shares = progressivePreviewDeposit(depositAmount, state, config);
				const stateAfter: CurveState = {
					totalAssets: state.totalAssets + depositAmount,
					totalShares: state.totalShares + shares,
				};
				const assetsBack = progressivePreviewRedeem(shares, stateAfter, config);
				expect(assetsBack).toBeLessThanOrEqual(depositAmount);
			}
		});

		it('price increases monotonically with supply', () => {
			const prices: bigint[] = [];
			for (let i = 1; i <= 5; i++) {
				const state: CurveState = {
					totalAssets: 0n,
					totalShares: BigInt(i) * 10n * E18,
				};
				prices.push(progressiveCurrentPrice(state, config));
			}
			for (let i = 1; i < prices.length; i++) {
				expect(prices[i]).toBeGreaterThan(prices[i - 1] as bigint);
			}
		});
	});

	describe('slope validation', () => {
		it('throws for odd slope', () => {
			const badConfig: ProgressiveCurveConfig = { slope: 3n };
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(() => progressivePreviewDeposit(E18, state, badConfig)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});

		it('throws for zero slope', () => {
			const badConfig: ProgressiveCurveConfig = { slope: 0n };
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(() => progressivePreviewDeposit(E18, state, badConfig)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});

		it('throws for negative slope', () => {
			const badConfig: ProgressiveCurveConfig = { slope: -2n };
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(() => progressivePreviewDeposit(E18, state, badConfig)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});
	});

	describe('various slopes', () => {
		it('different slopes produce positive shares from zero', () => {
			for (const slopeWad of [2n, 4n, 10n, 100n, 1_000_000n]) {
				const cfg: ProgressiveCurveConfig = {
					slope: slopeWad * E18,
				};
				const shares = progressivePreviewDeposit(E18, { totalAssets: 0n, totalShares: 0n }, cfg);
				expect(shares).toBeGreaterThan(0n);

				const price = progressiveCurrentPrice({ totalAssets: 0n, totalShares: 0n }, cfg);
				expect(price).toBe(0n);
			}
		});
	});

	describe('createProgressiveCurve', () => {
		it('implements the Curve interface', () => {
			const curve = createProgressiveCurve(config);
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};

			expect(curve.previewDeposit(E18, state)).toBe(progressivePreviewDeposit(E18, state, config));
			expect(curve.previewRedeem(E18, state)).toBe(progressivePreviewRedeem(E18, state, config));
			expect(curve.previewMint(E18, state)).toBe(progressivePreviewMint(E18, state, config));
			expect(curve.currentPrice(state)).toBe(progressiveCurrentPrice(state, config));
			expect(curve.convertToShares(E18, state)).toBe(
				progressiveConvertToShares(E18, state, config)
			);
			expect(curve.convertToAssets(E18, state)).toBe(
				progressiveConvertToAssets(E18, state, config)
			);
		});
	});
});

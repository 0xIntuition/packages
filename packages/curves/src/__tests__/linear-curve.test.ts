import { describe, expect, it } from 'vitest';

import {
	createLinearCurve,
	linearConvertToAssets,
	linearConvertToShares,
	linearCurrentPrice,
	linearPreviewDeposit,
	linearPreviewMint,
	linearPreviewRedeem,
	linearPreviewWithdraw,
} from '../linear-curve';
import { WAD } from '../math';
import type { CurveState } from '../types';

const E18 = WAD;

describe('linear-curve', () => {
	describe('convertToShares', () => {
		it('returns 1:1 when no existing supply', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(linearConvertToShares(5n * E18, state)).toBe(5n * E18);
		});

		it('converts proportionally with existing supply', () => {
			const state: CurveState = {
				totalAssets: 50n * E18,
				totalShares: 10n * E18,
			};
			expect(linearConvertToShares(5n * E18, state)).toBe(1n * E18);
		});

		it('rounds down', () => {
			const state: CurveState = {
				totalAssets: 3n,
				totalShares: 2n,
			};
			// 1 * 2 / 3 = 0.666... → 0
			expect(linearConvertToShares(1n, state)).toBe(0n);
		});

		it('throws when totalShares > 0 but totalAssets = 0', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 10n };
			expect(() => linearConvertToShares(5n, state)).toThrow(
				'totalAssets must be greater than zero'
			);
		});
	});

	describe('convertToAssets', () => {
		it('returns 1:1 when no existing supply', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(linearConvertToAssets(5n * E18, state)).toBe(5n * E18);
		});

		it('converts proportionally with existing supply', () => {
			const state: CurveState = {
				totalAssets: 50n * E18,
				totalShares: 10n * E18,
			};
			expect(linearConvertToAssets(1n * E18, state)).toBe(5n * E18);
		});

		it('throws when shares exceed totalShares', () => {
			const state: CurveState = {
				totalAssets: 50n * E18,
				totalShares: 10n * E18,
			};
			expect(() => linearConvertToAssets(11n * E18, state)).toThrow(
				'shares cannot exceed totalShares'
			);
		});
	});

	describe('previewDeposit', () => {
		it('matches Rust parity: 1 ETH into empty vault = 1 ETH shares', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(linearPreviewDeposit(E18, state)).toBe(E18);
		});

		it('returns 0 for zero deposit', () => {
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 5n * E18,
			};
			expect(linearPreviewDeposit(0n, state)).toBe(0n);
		});
	});

	describe('previewMint', () => {
		it('rounds up — matches Rust parity fixture', () => {
			// Rust fixture: mint 1e18 shares with state {3e18+1 assets, 2e18 shares}
			// Expected: 1_500_000_000_000_000_001
			const state: CurveState = {
				totalAssets: 3_000_000_000_000_000_001n,
				totalShares: 2_000_000_000_000_000_000n,
			};
			expect(linearPreviewMint(E18, state)).toBe(1_500_000_000_000_000_001n);
		});

		it('returns 1:1 from empty state', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(linearPreviewMint(7n, state)).toBe(7n);
		});
	});

	describe('previewRedeem', () => {
		it('returns proportional assets', () => {
			const state: CurveState = {
				totalAssets: 50n * E18,
				totalShares: 10n * E18,
			};
			expect(linearPreviewRedeem(1n * E18, state)).toBe(5n * E18);
		});

		it('full redeem returns all assets', () => {
			const totalAssets = 123_456_789n;
			const totalShares = 987_654_321n;
			const state: CurveState = { totalAssets, totalShares };
			expect(linearPreviewRedeem(totalShares, state)).toBe(totalAssets);
		});

		it('2:1 ratio: each share worth 2 assets', () => {
			const state: CurveState = {
				totalAssets: 20n * E18,
				totalShares: 10n * E18,
			};
			expect(linearPreviewRedeem(E18, state)).toBe(2n * E18);
		});
	});

	describe('previewWithdraw', () => {
		it('rounds up — matches Rust parity fixture', () => {
			// Rust fixture: withdraw 1e18 assets from {3e18 assets, 2e18 shares}
			// Expected: 666_666_666_666_666_667
			const state: CurveState = {
				totalAssets: 3_000_000_000_000_000_000n,
				totalShares: 2_000_000_000_000_000_000n,
			};
			expect(linearPreviewWithdraw(E18, state)).toBe(666_666_666_666_666_667n);
		});

		it('returns 1:1 from zero-supply state', () => {
			const state: CurveState = {
				totalAssets: 7n,
				totalShares: 0n,
			};
			expect(linearPreviewWithdraw(7n, state)).toBe(7n);
		});

		it('throws when assets exceed totalAssets', () => {
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 5n * E18,
			};
			expect(() => linearPreviewWithdraw(11n * E18, state)).toThrow(
				'assets cannot exceed totalAssets'
			);
		});
	});

	describe('currentPrice', () => {
		it('returns WAD for 1:1 ratio', () => {
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 10n * E18,
			};
			expect(linearCurrentPrice(state)).toBe(E18);
		});

		it('returns WAD for empty state (1:1 default)', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(linearCurrentPrice(state)).toBe(E18);
		});

		it('matches Rust parity: MAX/MAX = 1e18', () => {
			// Rust fixture: current_price_max_domain = 1e18
			// We cannot use U256::MAX in bigint space, but for equal values, price = assets/shares = 1:1
			const large = 10n ** 40n;
			const state: CurveState = {
				totalAssets: large,
				totalShares: large,
			};
			expect(linearCurrentPrice(state)).toBe(E18);
		});

		it('reflects 5:1 ratio', () => {
			const state: CurveState = {
				totalAssets: 50n * E18,
				totalShares: 10n * E18,
			};
			expect(linearCurrentPrice(state)).toBe(5n * E18);
		});
	});

	describe('round-trip invariants', () => {
		it('deposit then redeem never profits (protocol favored)', () => {
			const depositAmount = 5n * E18;
			const states: CurveState[] = [
				{ totalAssets: 0n, totalShares: 0n },
				{ totalAssets: E18, totalShares: E18 },
				{ totalAssets: 100n * E18, totalShares: 50n * E18 },
				{ totalAssets: 999_999_999n, totalShares: 1_000_000_001n },
			];

			for (const state of states) {
				const shares = linearPreviewDeposit(depositAmount, state);
				const stateAfter: CurveState = {
					totalAssets: state.totalAssets + depositAmount,
					totalShares: state.totalShares + shares,
				};
				const assetsBack = linearPreviewRedeem(shares, stateAfter);
				expect(assetsBack).toBeLessThanOrEqual(depositAmount);
			}
		});

		it('multi-deposit full redeem returns all assets (linear is exact)', () => {
			const curve = createLinearCurve();
			let totalAssets = 0n;
			let totalShares = 0n;

			const amounts = [E18, 3n * E18, 7n * E18, 2n * E18];

			for (const amount of amounts) {
				const state: CurveState = { totalAssets, totalShares };
				const shares = curve.previewDeposit(amount, state);
				totalAssets += amount;
				totalShares += shares;
			}

			const state: CurveState = { totalAssets, totalShares };
			const assetsBack = curve.previewRedeem(totalShares, state);
			expect(assetsBack).toBe(totalAssets);
		});
	});

	describe('convert matches preview', () => {
		it('convertToShares matches previewDeposit', () => {
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 5n * E18,
			};
			expect(linearConvertToShares(E18, state)).toBe(linearPreviewDeposit(E18, state));
		});

		it('convertToAssets matches previewRedeem', () => {
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 5n * E18,
			};
			expect(linearConvertToAssets(E18, state)).toBe(linearPreviewRedeem(E18, state));
		});
	});

	describe('mint-withdraw consistency', () => {
		it('withdraw rounds up: shares_to_withdraw >= mint_shares', () => {
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 5n * E18,
			};
			const mintShares = E18;
			const assetsNeeded = linearPreviewMint(mintShares, state);

			const stateAfter: CurveState = {
				totalAssets: state.totalAssets + assetsNeeded,
				totalShares: state.totalShares + mintShares,
			};
			const sharesToWithdraw = linearPreviewWithdraw(assetsNeeded, stateAfter);
			expect(sharesToWithdraw).toBeGreaterThanOrEqual(mintShares);
		});
	});

	describe('rounding directions', () => {
		it('deposit rounds down, mint rounds up', () => {
			const state: CurveState = { totalAssets: 3n, totalShares: 2n };

			// deposit: 1 * 2 / 3 = 0 (rounded down)
			const depositShares = linearPreviewDeposit(1n, state);
			// mint: ceil(1 * 3 / 2) = 2 (rounded up)
			const mintAssets = linearPreviewMint(1n, state);

			expect(depositShares).toBe(0n);
			expect(mintAssets).toBe(2n);
		});
	});

	describe('createLinearCurve', () => {
		it('implements the Curve interface', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 5n * E18,
			};

			expect(curve.previewDeposit(E18, state)).toBe(linearPreviewDeposit(E18, state));
			expect(curve.previewRedeem(E18, state)).toBe(linearPreviewRedeem(E18, state));
			expect(curve.previewMint(E18, state)).toBe(linearPreviewMint(E18, state));
			expect(curve.currentPrice(state)).toBe(linearCurrentPrice(state));
		});
	});
});

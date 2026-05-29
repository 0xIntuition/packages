import { describe, expect, it } from 'vitest';

import { WAD } from '../math';
import {
	createOffsetProgressiveCurve,
	offsetProgressiveConvertToAssets,
	offsetProgressiveConvertToShares,
	offsetProgressiveCurrentPrice,
	offsetProgressivePreviewDeposit,
	offsetProgressivePreviewMint,
	offsetProgressivePreviewRedeem,
	offsetProgressivePreviewWithdraw,
} from '../offset-progressive-curve';
import type { CurveState, OffsetProgressiveCurveConfig } from '../types';

const E18 = WAD;

describe('offset-progressive-curve', () => {
	const config: OffsetProgressiveCurveConfig = {
		slope: 2n * E18,
		offset: 1n * E18,
	};

	describe('convertToShares / convertToAssets', () => {
		it('produces positive shares for a deposit', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 2n * E18 };
			const shares = offsetProgressiveConvertToShares(4n * E18, state, config);
			expect(shares).toBeGreaterThan(0n);
		});

		it('round-trip redeem never exceeds deposited amount', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 2n * E18 };
			const assets = 4n * E18;
			const shares = offsetProgressiveConvertToShares(assets, state, config);
			const redeemed = offsetProgressiveConvertToAssets(shares, state, config);
			expect(redeemed).toBeLessThanOrEqual(assets);
		});

		it('throws when shares exceed totalShares', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: E18 };
			expect(() => offsetProgressiveConvertToAssets(2n * E18, state, config)).toThrow(
				'shares cannot exceed totalShares'
			);
		});
	});

	describe('currentPrice', () => {
		it('includes offset: price = (totalShares + offset) * slope / WAD', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 2n * E18 };
			// (2e18 + 1e18) * 2e18 / 1e18 = 6e18
			expect(offsetProgressiveCurrentPrice(state, config)).toBe(6n * E18);
		});

		it('has non-zero price at zero supply (due to offset)', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			// offset * slope / WAD = 1e18 * 2e18 / 1e18 = 2e18
			expect(offsetProgressiveCurrentPrice(state, config)).toBe(2n * E18);
		});
	});

	describe('Rust parity fixtures', () => {
		// Using slope=2e18, offset=0.5e18 to match parity.json
		const parityConfig: OffsetProgressiveCurveConfig = {
			slope: 2_000_000_000_000_000_000n,
			offset: 500_000_000_000_000_000n,
		};

		it('current_price_zero = 1e18', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(offsetProgressiveCurrentPrice(state, parityConfig)).toBe(1_000_000_000_000_000_000n);
		});

		it('preview_deposit_from_zero = 618033988749894848', () => {
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(offsetProgressivePreviewDeposit(E18, state, parityConfig)).toBe(
				618_033_988_749_894_848n
			);
		});

		it('preview_mint with 10e18 shares = 22e18', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10_000_000_000_000_000_000n,
			};
			expect(offsetProgressivePreviewMint(E18, state, parityConfig)).toBe(
				22_000_000_000_000_000_000n
			);
		});

		it('preview_redeem with 10e18 shares = 20e18', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10_000_000_000_000_000_000n,
			};
			expect(offsetProgressivePreviewRedeem(E18, state, parityConfig)).toBe(
				20_000_000_000_000_000_000n
			);
		});

		it('preview_withdraw matches fixture', () => {
			const state: CurveState = {
				totalAssets: E18,
				totalShares: 10_000_000_000_000_000_000n,
			};
			expect(offsetProgressivePreviewWithdraw(E18, state, parityConfig)).toBe(
				47_727_519_816_563_834n
			);
		});

		it('preview_redeem_zero_offset_low_shares = 0', () => {
			const zeroOffsetConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 0n,
			};
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 700_560_508n,
			};
			expect(offsetProgressivePreviewRedeem(699_560_508n, state, zeroOffsetConfig)).toBe(0n);
		});
	});

	describe('preview functions', () => {
		it('previewDeposit returns 0 shares for 0 assets', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(offsetProgressivePreviewDeposit(0n, state, config)).toBe(0n);
		});

		it('previewRedeem returns 0 assets for 0 shares', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(offsetProgressivePreviewRedeem(0n, state, config)).toBe(0n);
		});

		it('previewWithdraw throws when assets exceed max', () => {
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: E18,
			};
			expect(() => offsetProgressivePreviewWithdraw(10n ** 30n, state, config)).toThrow(
				'assets cannot exceed redeemable assets'
			);
		});
	});

	describe('round-trip invariants', () => {
		it('deposit then redeem never profits', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			const depositAmount = 5n * E18;
			const states: CurveState[] = [
				{ totalAssets: 0n, totalShares: 0n },
				{ totalAssets: 0n, totalShares: 10n * E18 },
				{ totalAssets: 50n * E18, totalShares: 100n * E18 },
			];

			for (const state of states) {
				const shares = offsetProgressivePreviewDeposit(depositAmount, state, parityConfig);
				const stateAfter: CurveState = {
					totalAssets: state.totalAssets + depositAmount,
					totalShares: state.totalShares + shares,
				};
				const assetsBack = offsetProgressivePreviewRedeem(shares, stateAfter, parityConfig);
				expect(assetsBack).toBeLessThanOrEqual(depositAmount);
			}
		});

		it('interleaved deposit-redeem: early depositor profits on progressive curve', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			let totalAssets = 0n;
			let totalShares = 0n;

			// User A deposits 5 ETH
			const aDeposit = 5n * E18;
			const aShares = offsetProgressivePreviewDeposit(
				aDeposit,
				{ totalAssets, totalShares },
				parityConfig
			);
			totalAssets += aDeposit;
			totalShares += aShares;

			// User B deposits 10 ETH
			const bDeposit = 10n * E18;
			const bShares = offsetProgressivePreviewDeposit(
				bDeposit,
				{ totalAssets, totalShares },
				parityConfig
			);
			totalAssets += bDeposit;
			totalShares += bShares;

			// User A redeems
			const aReceived = offsetProgressivePreviewRedeem(
				aShares,
				{ totalAssets, totalShares },
				parityConfig
			);
			totalAssets -= aReceived;
			totalShares -= aShares;

			// User B redeems
			const bReceived = offsetProgressivePreviewRedeem(
				bShares,
				{ totalAssets, totalShares },
				parityConfig
			);
			totalAssets -= bReceived;
			totalShares -= bShares;

			// Early depositor benefits from later deposits
			expect(aReceived).toBeGreaterThan(aDeposit);

			// Rounding dust should be minimal
			expect(totalAssets).toBeLessThan(10n);
			expect(totalShares).toBe(0n);
		});

		it('multi-deposit full redeem bounded by total deposited', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			let totalAssets = 0n;
			let totalShares = 0n;
			let totalDeposited = 0n;

			const amounts = [E18, 5n * E18, 10n * E18];

			for (const amount of amounts) {
				const shares = offsetProgressivePreviewDeposit(
					amount,
					{ totalAssets, totalShares },
					parityConfig
				);
				totalAssets += amount;
				totalShares += shares;
				totalDeposited += amount;
			}

			const assetsBack = offsetProgressivePreviewRedeem(
				totalShares,
				{ totalAssets, totalShares },
				parityConfig
			);
			expect(assetsBack).toBeLessThanOrEqual(totalDeposited);

			// Rounding loss should be small: ~10 wei per operation
			const loss = totalDeposited - assetsBack;
			expect(loss).toBeLessThan(BigInt(amounts.length * 10));
		});
	});

	describe('price monotonicity', () => {
		it('price increases with supply', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			const prices: bigint[] = [];
			for (let i = 0; i < 5; i++) {
				const state: CurveState = {
					totalAssets: 0n,
					totalShares: BigInt(i) * 10n * E18,
				};
				prices.push(offsetProgressiveCurrentPrice(state, parityConfig));
			}
			for (let i = 1; i < prices.length; i++) {
				expect(prices[i]).toBeGreaterThan(prices[i - 1] as bigint);
			}
		});
	});

	describe('deposit monotonicity', () => {
		it('larger deposits yield more shares', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};

			const small = offsetProgressivePreviewDeposit(E18, state, parityConfig);
			const large = offsetProgressivePreviewDeposit(10n * E18, state, parityConfig);
			expect(large).toBeGreaterThan(small);
		});
	});

	describe('convert matches preview', () => {
		it('convertToShares matches previewDeposit', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(offsetProgressiveConvertToShares(E18, state, parityConfig)).toBe(
				offsetProgressivePreviewDeposit(E18, state, parityConfig)
			);
		});

		it('convertToAssets matches previewRedeem', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			expect(offsetProgressiveConvertToAssets(E18, state, parityConfig)).toBe(
				offsetProgressivePreviewRedeem(E18, state, parityConfig)
			);
		});
	});

	describe('mint-withdraw consistency', () => {
		it('withdraw rounds up: shares_to_withdraw >= mint_shares', () => {
			const parityConfig: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};
			const mintShares = E18;
			const assetsNeeded = offsetProgressivePreviewMint(mintShares, state, parityConfig);

			const stateAfter: CurveState = {
				totalAssets: state.totalAssets + assetsNeeded,
				totalShares: state.totalShares + mintShares,
			};
			const sharesToWithdraw = offsetProgressivePreviewWithdraw(
				assetsNeeded,
				stateAfter,
				parityConfig
			);
			expect(sharesToWithdraw).toBeGreaterThanOrEqual(mintShares);
		});
	});

	describe('slope validation', () => {
		it('throws for odd slope', () => {
			const badConfig: OffsetProgressiveCurveConfig = {
				slope: 3n,
				offset: 0n,
			};
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(() => offsetProgressivePreviewDeposit(E18, state, badConfig)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});

		it('throws for zero slope', () => {
			const badConfig: OffsetProgressiveCurveConfig = {
				slope: 0n,
				offset: 0n,
			};
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(() => offsetProgressivePreviewDeposit(E18, state, badConfig)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});

		it('throws for negative slope', () => {
			const badConfig: OffsetProgressiveCurveConfig = {
				slope: -2n,
				offset: 0n,
			};
			const state: CurveState = { totalAssets: 0n, totalShares: 0n };
			expect(() => offsetProgressivePreviewDeposit(E18, state, badConfig)).toThrow(
				'Slope must be a positive, even WAD-scaled integer.'
			);
		});
	});

	describe('createOffsetProgressiveCurve', () => {
		it('implements the Curve interface', () => {
			const curve = createOffsetProgressiveCurve(config);
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};

			expect(curve.previewDeposit(E18, state)).toBe(
				offsetProgressivePreviewDeposit(E18, state, config)
			);
			expect(curve.currentPrice(state)).toBe(offsetProgressiveCurrentPrice(state, config));
		});
	});
});

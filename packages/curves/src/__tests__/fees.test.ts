import { describe, expect, it } from 'vitest';

import {
	previewAtomDeposit,
	previewDepositWithFees,
	previewRedeemWithFees,
	previewTripleDeposit,
	totalFees,
} from '../fees';
import { createLinearCurve } from '../linear-curve';
import { WAD } from '../math';
import { createOffsetProgressiveCurve } from '../offset-progressive-curve';
import type {
	AtomFees,
	CurveState,
	FeeSchedule,
	OffsetProgressiveCurveConfig,
	TripleFees,
} from '../types';

const E18 = WAD;

const defaultFees: FeeSchedule = {
	denominator: 10_000n,
	protocolFee: 100n, // 1%
	entryFee: 50n, // 0.5%
	exitFee: 25n, // 0.25%
};

describe('fees', () => {
	describe('previewDepositWithFees (linear)', () => {
		it('matches Rust parity: 1000 assets, 1% protocol + 0.5% entry', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};

			const quote = previewDepositWithFees(curve, 1_000n, state, defaultFees, true);

			// protocol fee: ceil(1000 * 100 / 10000) = 10
			// entry fee: ceil(1000 * 50 / 10000) = 5
			// total deducted = 15
			// assets after fees = 985
			expect(quote.assetsAfterFees).toBe(985n);
			expect(quote.shares).toBe(985n); // 1:1 linear
			expect(quote.fees.protocolFee).toBe(10n);
			expect(quote.fees.entryFee).toBe(5n);
		});

		it('entry fee is 0 when not charged', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};

			const quote = previewDepositWithFees(curve, 1_000n, state, defaultFees, false);

			expect(quote.fees.entryFee).toBe(0n);
			expect(quote.assetsAfterFees).toBe(990n); // only protocol fee deducted
		});

		it('skipping entry fee yields more shares', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 10n * E18,
			};

			const withFee = previewDepositWithFees(curve, E18, state, defaultFees, true);
			const withoutFee = previewDepositWithFees(curve, E18, state, defaultFees, false);

			expect(withoutFee.shares).toBeGreaterThan(withFee.shares);
			expect(withoutFee.fees.entryFee).toBe(0n);
		});
	});

	describe('previewRedeemWithFees (linear)', () => {
		it('matches Rust parity: 1000 shares, 1% protocol + 0.25% exit', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};

			const quote = previewRedeemWithFees(curve, 1_000n, state, defaultFees, true);

			// assets before fees = 1000 (1:1 linear)
			// protocol fee: ceil(1000 * 100 / 10000) = 10
			// exit fee: ceil(1000 * 25 / 10000) = 3
			// total deducted = 13
			// assets after fees = 987
			expect(quote.assetsBeforeFees).toBe(1_000n);
			expect(quote.assetsAfterFees).toBe(987n);
			expect(quote.fees.protocolFee).toBe(10n);
			expect(quote.fees.exitFee).toBe(3n);
		});

		it('exit fee is 0 when not charged', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};

			const quote = previewRedeemWithFees(curve, 1_000n, state, defaultFees, false);

			expect(quote.fees.exitFee).toBe(0n);
			expect(quote.assetsAfterFees).toBe(990n);
		});

		it('skipping exit fee yields more assets', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 10n * E18,
			};

			const withFee = previewRedeemWithFees(curve, E18, state, defaultFees, true);
			const withoutFee = previewRedeemWithFees(curve, E18, state, defaultFees, false);

			expect(withoutFee.assetsAfterFees).toBeGreaterThan(withFee.assetsAfterFees);
			expect(withoutFee.fees.exitFee).toBe(0n);
		});
	});

	describe('previewDepositWithFees (progressive)', () => {
		it('works with progressive curve', () => {
			const config: OffsetProgressiveCurveConfig = {
				slope: 2_000_000_000_000_000_000n,
				offset: 500_000_000_000_000_000n,
			};
			const curve = createOffsetProgressiveCurve(config);
			const state: CurveState = {
				totalAssets: 0n,
				totalShares: 10n * E18,
			};

			const deposit = previewDepositWithFees(curve, 10n * E18, state, defaultFees, true);

			expect(deposit.assetsAfterFees).toBeLessThan(10n * E18);
			expect(deposit.shares).toBeGreaterThan(0n);

			// State after deposit
			const stateAfter: CurveState = {
				totalAssets: state.totalAssets + deposit.assetsAfterFees,
				totalShares: state.totalShares + deposit.shares,
			};
			const redeem = previewRedeemWithFees(curve, deposit.shares, stateAfter, defaultFees, true);
			expect(redeem.assetsAfterFees).toBeLessThan(deposit.assetsAfterFees);
		});
	});

	describe('previewAtomDeposit', () => {
		it('deducts protocol + entry + atom wallet fees', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};
			const atomFees: AtomFees = { atomWalletDepositFee: 200n }; // 2%

			const quote = previewAtomDeposit(curve, 1_000n, state, defaultFees, atomFees, true);

			// protocol: ceil(1000 * 100 / 10000) = 10
			// entry: ceil(1000 * 50 / 10000) = 5
			// atom wallet: ceil(1000 * 200 / 10000) = 20
			// total = 35
			expect(quote.fees.protocolFee).toBe(10n);
			expect(quote.fees.entryFee).toBe(5n);
			expect(quote.fees.atomWalletFee).toBe(20n);
			expect(quote.assetsAfterFees).toBe(965n);
			expect(quote.shares).toBe(965n);
		});

		it('skips entry fee when not charged', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};
			const atomFees: AtomFees = { atomWalletDepositFee: 200n };

			const quote = previewAtomDeposit(curve, 1_000n, state, defaultFees, atomFees, false);

			expect(quote.fees.entryFee).toBe(0n);
			expect(quote.assetsAfterFees).toBe(970n);
		});
	});

	describe('previewTripleDeposit', () => {
		it('deducts protocol + entry + atom deposit fraction', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};
			const tripleFees: TripleFees = { atomDepositFraction: 300n }; // 3%

			const quote = previewTripleDeposit(curve, 1_000n, state, defaultFees, tripleFees, true, true);

			// protocol: ceil(1000 * 100 / 10000) = 10
			// entry: ceil(1000 * 50 / 10000) = 5
			// atom fraction: ceil(1000 * 300 / 10000) = 30
			// total = 45
			expect(quote.fees.protocolFee).toBe(10n);
			expect(quote.fees.entryFee).toBe(5n);
			expect(quote.fees.atomDepositFraction).toBe(30n);
			expect(quote.assetsAfterFees).toBe(955n);
			expect(quote.shares).toBe(955n);
		});

		it('skips entry fee and atom fraction when not charged', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10_000n,
				totalShares: 10_000n,
			};
			const tripleFees: TripleFees = { atomDepositFraction: 300n };

			const quote = previewTripleDeposit(
				curve,
				1_000n,
				state,
				defaultFees,
				tripleFees,
				false,
				false
			);

			expect(quote.fees.entryFee).toBe(0n);
			expect(quote.fees.atomDepositFraction).toBe(0n);
			expect(quote.assetsAfterFees).toBe(990n);
		});
	});

	describe('totalFees', () => {
		it('sums all fee components', () => {
			const fees = {
				protocolFee: 10n,
				entryFee: 5n,
				exitFee: 3n,
				atomWalletFee: 20n,
				atomDepositFraction: 30n,
			};
			expect(totalFees(fees)).toBe(68n);
		});

		it('returns 0 for empty fees', () => {
			const fees = {
				protocolFee: 0n,
				entryFee: 0n,
				exitFee: 0n,
				atomWalletFee: 0n,
				atomDepositFraction: 0n,
			};
			expect(totalFees(fees)).toBe(0n);
		});
	});

	describe('zero-amount edge cases', () => {
		it('zero deposit yields zero shares and zero fees', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 10n * E18,
			};

			const quote = previewDepositWithFees(curve, 0n, state, defaultFees, true);

			expect(quote.shares).toBe(0n);
			expect(quote.assetsAfterFees).toBe(0n);
			expect(quote.fees.protocolFee).toBe(0n);
			expect(quote.fees.entryFee).toBe(0n);
		});

		it('zero redeem yields zero assets and zero fees', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 10n * E18,
			};

			const quote = previewRedeemWithFees(curve, 0n, state, defaultFees, true);

			expect(quote.assetsBeforeFees).toBe(0n);
			expect(quote.assetsAfterFees).toBe(0n);
			expect(quote.fees.protocolFee).toBe(0n);
			expect(quote.fees.exitFee).toBe(0n);
		});
	});

	describe('zero protocol fee', () => {
		it('only charges entry fee', () => {
			const curve = createLinearCurve();
			const state: CurveState = {
				totalAssets: 10n * E18,
				totalShares: 10n * E18,
			};
			const fees: FeeSchedule = {
				denominator: 10_000n,
				protocolFee: 0n,
				entryFee: 100n, // 1%
				exitFee: 100n,
			};

			const deposit = previewDepositWithFees(curve, E18, state, fees, true);
			expect(deposit.fees.protocolFee).toBe(0n);
			expect(deposit.fees.entryFee).toBeGreaterThan(0n);
		});
	});
});

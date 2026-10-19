import { describe, expect, it } from 'vitest';

import {
	grossUpAtomCreate,
	grossUpAtomDeposit,
	grossUpTripleCreate,
	grossUpTripleDeposit,
	previewAtomDeposit,
	previewDepositWithFees,
	previewRedeemWithFees,
	previewTripleDeposit,
	totalFees,
} from '../fees.js';
import { createLinearCurve } from '../linear-curve.js';
import { feeOnRaw, WAD } from '../math.js';
import { createOffsetProgressiveCurve } from '../offset-progressive-curve.js';
import type {
	AtomFees,
	CurveState,
	FeeSchedule,
	OffsetProgressiveCurveConfig,
	TripleFees,
} from '../types.js';

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

	describe('exact-net gross-up', () => {
		const curve = createLinearCurve();
		const state: CurveState = {
			totalAssets: 10n * E18,
			totalShares: 10n * E18,
		};

		it('round-trips atom and triple deposits through the preview mirrors', () => {
			const fees: FeeSchedule = {
				denominator: 10_000n,
				protocolFee: 125n,
				entryFee: 50n,
				exitFee: 0n,
			};
			const atomFees: AtomFees = { atomWalletDepositFee: 50n };
			const tripleFees: TripleFees = { atomDepositFraction: 90n };
			const netAssets = E18;
			const minShareCost = 12_345n;

			const atom = grossUpAtomDeposit(netAssets, fees, atomFees, true, minShareCost);
			const atomPreview = previewAtomDeposit(
				curve,
				atom.grossAssets - minShareCost,
				state,
				fees,
				atomFees,
				true
			);
			expect(atom.grossAssets).toBeGreaterThan(netAssets + minShareCost);
			expect(atomPreview.assetsAfterFees).toBe(netAssets);
			expect(atom.assetsAfterFees).toBe(netAssets);

			const triple = grossUpTripleDeposit(netAssets, fees, tripleFees, true, true, minShareCost);
			const triplePreview = previewTripleDeposit(
				curve,
				triple.grossAssets - minShareCost,
				state,
				fees,
				tripleFees,
				true,
				true
			);
			expect(triplePreview.assetsAfterFees).toBe(netAssets);
			expect(triple.assetsAfterFees).toBe(netAssets);
		});

		it('round-trips create deposits after their fixed costs without entry fees', () => {
			const fees: FeeSchedule = {
				denominator: 10_000n,
				protocolFee: 125n,
				entryFee: 9_999n,
				exitFee: 0n,
			};
			const atomFees: AtomFees = { atomWalletDepositFee: 50n };
			const tripleFees: TripleFees = { atomDepositFraction: 90n };
			const netAssets = E18;
			const atomCost = 10n ** 16n;
			const tripleCost = 2n * 10n ** 16n;

			const atom = grossUpAtomCreate(netAssets, fees, atomFees, atomCost);
			const atomBase = atom.grossAssets - atomCost;
			expect(
				atomBase -
					feeOnRaw(atomBase, fees.protocolFee, fees.denominator) -
					feeOnRaw(atomBase, atomFees.atomWalletDepositFee, fees.denominator)
			).toBe(netAssets);

			const triple = grossUpTripleCreate(netAssets, fees, tripleFees, true, tripleCost);
			const tripleBase = triple.grossAssets - tripleCost;
			expect(
				tripleBase -
					feeOnRaw(tripleBase, fees.protocolFee, fees.denominator) -
					feeOnRaw(tripleBase, tripleFees.atomDepositFraction, fees.denominator)
			).toBe(netAssets);
		});

		it('supports zero fees, disabled conditionals, tiny values, and D−T edge cases', () => {
			const zeroFees: FeeSchedule = {
				denominator: 10_000n,
				protocolFee: 0n,
				entryFee: 0n,
				exitFee: 0n,
			};
			expect(
				grossUpAtomDeposit(1n, zeroFees, { atomWalletDepositFee: 0n }, false).grossAssets
			).toBe(1n);

			const edgeFees: FeeSchedule = {
				denominator: 10_000n,
				protocolFee: 9_997n,
				entryFee: 1n,
				exitFee: 0n,
			};
			const edge = grossUpTripleDeposit(
				10n ** 16n,
				edgeFees,
				{ atomDepositFraction: 1n },
				true,
				true
			);
			expect(edge.assetsAfterFees).toBe(10n ** 16n);

			const flagsOff = grossUpTripleDeposit(
				123n,
				{ ...edgeFees, protocolFee: 0n },
				{ atomDepositFraction: 9_999n },
				false,
				false
			);
			expect(flagsOff.grossAssets).toBe(123n);
		});

		it('continues past two fixups for valid high-fee schedules', () => {
			const quote = grossUpAtomDeposit(
				1n,
				{
					denominator: 79n,
					protocolFee: 2n,
					entryFee: 75n,
					exitFee: 0n,
				},
				{ atomWalletDepositFee: 0n },
				true
			);

			expect(quote.assetsAfterFees).toBe(1n);
			expect(quote.fixupIterations).toBeGreaterThan(2);
		});

		it('property-checks exact net values across deterministic randomized fee combinations', () => {
			let seed = 0x5eed_1392n;
			const next = (limit: bigint) => {
				seed =
					(seed * 6_364_136_223_846_793_005n + 1_442_695_040_888_963_407n) & ((1n << 64n) - 1n);
				return seed % limit;
			};

			for (let sample = 0; sample < 20_000; sample += 1) {
				const denominator = 10_000n + next(90_000n);
				const protocolFee = next(denominator / 75n + 1n);
				const entryFee = next(denominator / 75n + 1n);
				const specializedFee = next(denominator / 75n + 1n);
				const chargeEntryFee = next(2n) === 1n;
				const chargeSpecializedFee = next(2n) === 1n;

				const fees: FeeSchedule = {
					denominator,
					protocolFee,
					entryFee,
					exitFee: 0n,
				};
				const netAssets = sample % 5 === 0 ? 10n ** 16n + next(10_000n) : 1n + next(10n ** 24n);
				const minShareCost = next(10n ** 18n);

				const atom = grossUpAtomDeposit(
					netAssets,
					fees,
					{ atomWalletDepositFee: specializedFee },
					chargeEntryFee,
					minShareCost
				);
				const atomPreview = previewAtomDeposit(
					curve,
					atom.grossAssets - minShareCost,
					state,
					fees,
					{ atomWalletDepositFee: specializedFee },
					chargeEntryFee
				);
				expect(atomPreview.assetsAfterFees).toBe(netAssets);

				const triple = grossUpTripleDeposit(
					netAssets,
					fees,
					{ atomDepositFraction: specializedFee },
					chargeEntryFee,
					chargeSpecializedFee,
					minShareCost
				);
				const triplePreview = previewTripleDeposit(
					curve,
					triple.grossAssets - minShareCost,
					state,
					fees,
					{ atomDepositFraction: specializedFee },
					chargeEntryFee,
					chargeSpecializedFee
				);
				expect(triplePreview.assetsAfterFees).toBe(netAssets);

				const atomCreate = grossUpAtomCreate(
					netAssets,
					fees,
					{ atomWalletDepositFee: specializedFee },
					minShareCost
				);
				const atomCreatePreview = previewAtomDeposit(
					curve,
					atomCreate.grossAssets - minShareCost,
					state,
					fees,
					{ atomWalletDepositFee: specializedFee },
					false
				);
				expect(atomCreatePreview.assetsAfterFees).toBe(netAssets);

				const tripleCreate = grossUpTripleCreate(
					netAssets,
					fees,
					{ atomDepositFraction: specializedFee },
					chargeSpecializedFee,
					minShareCost
				);
				const tripleCreatePreview = previewTripleDeposit(
					curve,
					tripleCreate.grossAssets - minShareCost,
					state,
					fees,
					{ atomDepositFraction: specializedFee },
					false,
					chargeSpecializedFee
				);
				expect(tripleCreatePreview.assetsAfterFees).toBe(netAssets);
			}
		});

		it('rejects fee schedules with no positive net and invalid inputs', () => {
			const invalidFees: FeeSchedule = {
				denominator: 100n,
				protocolFee: 50n,
				entryFee: 50n,
				exitFee: 0n,
			};
			expect(() => grossUpAtomDeposit(1n, invalidFees, { atomWalletDepositFee: 0n }, true)).toThrow(
				'Applicable fees must total less than the fee denominator.'
			);
			expect(() =>
				grossUpAtomDeposit(-1n, defaultFees, { atomWalletDepositFee: 0n }, false)
			).toThrow('Net assets must be zero or greater.');
			expect(() => grossUpAtomCreate(1n, defaultFees, { atomWalletDepositFee: 0n }, -1n)).toThrow(
				'Additive cost must be zero or greater.'
			);
		});
	});
});

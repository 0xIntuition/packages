/**
 * Fee calculation helpers matching the Rust `fees.rs` API surface.
 *
 * Fee handling stays outside the pure curve implementations so callers can
 * opt into quote simulation without changing the contract-math layer.
 */

import { feeOnRaw } from './math';
import type {
	AtomFees,
	Curve,
	CurveState,
	DepositQuote,
	FeeBreakdown,
	FeeSchedule,
	RedeemQuote,
	TripleFees,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyFeeBreakdown(): FeeBreakdown {
	return {
		protocolFee: 0n,
		entryFee: 0n,
		exitFee: 0n,
		atomWalletFee: 0n,
		atomDepositFraction: 0n,
	};
}

/** Sum of all components in a fee breakdown. */
export function totalFees(fees: FeeBreakdown): bigint {
	return (
		fees.protocolFee + fees.entryFee + fees.exitFee + fees.atomWalletFee + fees.atomDepositFraction
	);
}

// ---------------------------------------------------------------------------
// Basic deposit / redeem (protocol + entry/exit only)
// ---------------------------------------------------------------------------

/**
 * Simulates deposit fee deduction with only base vault fees (protocol + optional entry).
 *
 * Mirrors `MultiVault._calculateAtomDeposit` / `_calculateTripleDeposit` base fee logic.
 */
export function previewDepositWithFees(
	curve: Curve,
	assetsBeforeFees: bigint,
	state: CurveState,
	fees: FeeSchedule,
	chargeEntryFee: boolean
): DepositQuote {
	const protocolFee = feeOnRaw(assetsBeforeFees, fees.protocolFee, fees.denominator);
	const entryFee = chargeEntryFee
		? feeOnRaw(assetsBeforeFees, fees.entryFee, fees.denominator)
		: 0n;

	const totalDeducted = protocolFee + entryFee;
	const assetsAfterFees = assetsBeforeFees - totalDeducted;
	const shares = curve.previewDeposit(assetsAfterFees, state);

	return {
		shares,
		assetsBeforeFees,
		assetsAfterFees,
		fees: {
			...emptyFeeBreakdown(),
			protocolFee,
			entryFee,
		},
	};
}

/**
 * Simulates redeem fee deduction (protocol + optional exit).
 *
 * Mirrors `MultiVault._calculateRedeem` fee logic.
 */
export function previewRedeemWithFees(
	curve: Curve,
	shares: bigint,
	state: CurveState,
	fees: FeeSchedule,
	chargeExitFee: boolean
): RedeemQuote {
	const assetsBeforeFees = curve.previewRedeem(shares, state);
	const protocolFee = feeOnRaw(assetsBeforeFees, fees.protocolFee, fees.denominator);
	const exitFee = chargeExitFee ? feeOnRaw(assetsBeforeFees, fees.exitFee, fees.denominator) : 0n;

	const totalDeducted = protocolFee + exitFee;
	const assetsAfterFees = assetsBeforeFees - totalDeducted;

	return {
		shares,
		assetsBeforeFees,
		assetsAfterFees,
		fees: {
			...emptyFeeBreakdown(),
			protocolFee,
			exitFee,
		},
	};
}

// ---------------------------------------------------------------------------
// Atom deposit (protocol + entry + atom wallet fee)
// ---------------------------------------------------------------------------

/**
 * Mirrors `MultiVault._calculateAtomDeposit` fee deduction:
 *   1. protocolFee  = feeOnRaw(assets, protocolFee)
 *   2. entryFee     = feeOnRaw(assets, entryFee)  (if charged)
 *   3. walletFee    = feeOnRaw(assets, atomWalletDepositFee)
 *   4. assetsAfterFees = assets - all fees
 *   5. shares       = curve.previewDeposit(assetsAfterFees, state)
 */
export function previewAtomDeposit(
	curve: Curve,
	assets: bigint,
	state: CurveState,
	fees: FeeSchedule,
	atomFees: AtomFees,
	chargeEntryFee: boolean
): DepositQuote {
	const protocolFee = feeOnRaw(assets, fees.protocolFee, fees.denominator);
	const entryFee = chargeEntryFee ? feeOnRaw(assets, fees.entryFee, fees.denominator) : 0n;
	const atomWalletFee = feeOnRaw(assets, atomFees.atomWalletDepositFee, fees.denominator);

	const totalDeducted = protocolFee + entryFee + atomWalletFee;
	const assetsAfterFees = assets - totalDeducted;
	const shares = curve.previewDeposit(assetsAfterFees, state);

	return {
		shares,
		assetsBeforeFees: assets,
		assetsAfterFees,
		fees: {
			...emptyFeeBreakdown(),
			protocolFee,
			entryFee,
			atomWalletFee,
		},
	};
}

// ---------------------------------------------------------------------------
// Triple deposit (protocol + entry + atom deposit fraction)
// ---------------------------------------------------------------------------

/**
 * Mirrors `MultiVault._calculateTripleDeposit` fee deduction:
 *   1. protocolFee        = feeOnRaw(assets, protocolFee)
 *   2. entryFee           = feeOnRaw(assets, entryFee)  (if charged)
 *   3. atomDepositFraction= feeOnRaw(assets, atomDepositFractionForTriple) (if charged)
 *   4. assetsAfterFees    = assets - all fees
 *   5. shares             = curve.previewDeposit(assetsAfterFees, state)
 */
export function previewTripleDeposit(
	curve: Curve,
	assets: bigint,
	state: CurveState,
	fees: FeeSchedule,
	tripleFees: TripleFees,
	chargeEntryFee: boolean,
	chargeAtomDepositFraction: boolean
): DepositQuote {
	const protocolFee = feeOnRaw(assets, fees.protocolFee, fees.denominator);
	const entryFee = chargeEntryFee ? feeOnRaw(assets, fees.entryFee, fees.denominator) : 0n;
	const atomDepositFraction = chargeAtomDepositFraction
		? feeOnRaw(assets, tripleFees.atomDepositFraction, fees.denominator)
		: 0n;

	const totalDeducted = protocolFee + entryFee + atomDepositFraction;
	const assetsAfterFees = assets - totalDeducted;
	const shares = curve.previewDeposit(assetsAfterFees, state);

	return {
		shares,
		assetsBeforeFees: assets,
		assetsAfterFees,
		fees: {
			...emptyFeeBreakdown(),
			protocolFee,
			entryFee,
			atomDepositFraction,
		},
	};
}

/**
 * Fee calculation helpers matching the Rust `fees.rs` API surface.
 *
 * Fee handling stays outside the pure curve implementations so callers can
 * opt into quote simulation without changing the contract-math layer.
 */

import { feeOnRaw } from './math.js';
import type {
	AtomFees,
	Curve,
	CurveState,
	DepositQuote,
	FeeBreakdown,
	FeeSchedule,
	GrossDepositQuote,
	RedeemQuote,
	TripleFees,
} from './types.js';

const MAX_GROSS_UP_FIXUP_ITERATIONS = 1_000_000;

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

function grossUpFeeBase(
	netAssets: bigint,
	denominator: bigint,
	feeNumerators: bigint[],
	additiveCost: bigint
): GrossDepositQuote {
	if (netAssets < 0n) {
		throw new Error('Net assets must be zero or greater.');
	}
	if (additiveCost < 0n) {
		throw new Error('Additive cost must be zero or greater.');
	}
	if (denominator <= 0n) {
		throw new Error('Fee denominator must be greater than zero.');
	}
	if (feeNumerators.some((fee) => fee < 0n)) {
		throw new Error('Fee numerators must be zero or greater.');
	}

	const totalNumerator = feeNumerators.reduce((total, fee) => total + fee, 0n);
	if (totalNumerator >= denominator) {
		throw new Error('Applicable fees must total less than the fee denominator.');
	}

	const netFromFeeBase = (feeBase: bigint) =>
		feeNumerators.reduce(
			(assetsAfterFees, fee) => assetsAfterFees - feeOnRaw(feeBase, fee, denominator),
			feeBase
		);

	let feeBase =
		netAssets === 0n
			? 0n
			: (netAssets * denominator + denominator - totalNumerator - 1n) /
				(denominator - totalNumerator);
	let assetsAfterFees = netFromFeeBase(feeBase);
	let fixupIterations = 0;

	while (assetsAfterFees < netAssets) {
		if (fixupIterations >= MAX_GROSS_UP_FIXUP_ITERATIONS) {
			throw new Error('Unable to solve an exact gross deposit within the iteration limit.');
		}
		feeBase += 1n;
		fixupIterations += 1;
		assetsAfterFees = netFromFeeBase(feeBase);
	}

	if (assetsAfterFees !== netAssets) {
		throw new Error('Unable to solve an exact gross deposit.');
	}

	return {
		grossAssets: feeBase + additiveCost,
		feeBase,
		assetsAfterFees,
		fixupIterations,
	};
}

/**
 * Solves the gross atom-deposit value for an exact net amount.
 *
 * `minShareCost` is added after solving because the contract removes it before
 * calculating percentage fees for the first deposit into a vault.
 */
export function grossUpAtomDeposit(
	netAssets: bigint,
	fees: FeeSchedule,
	atomFees: AtomFees,
	chargeEntryFee: boolean,
	minShareCost = 0n
): GrossDepositQuote {
	return grossUpFeeBase(
		netAssets,
		fees.denominator,
		[fees.protocolFee, chargeEntryFee ? fees.entryFee : 0n, atomFees.atomWalletDepositFee],
		minShareCost
	);
}

/**
 * Solves the gross triple-deposit value for an exact net amount.
 *
 * Fee applicability is explicit because entry and atom-fraction fees depend on
 * different vault state.
 */
export function grossUpTripleDeposit(
	netAssets: bigint,
	fees: FeeSchedule,
	tripleFees: TripleFees,
	chargeEntryFee: boolean,
	chargeAtomDepositFraction: boolean,
	minShareCost = 0n
): GrossDepositQuote {
	return grossUpFeeBase(
		netAssets,
		fees.denominator,
		[
			fees.protocolFee,
			chargeEntryFee ? fees.entryFee : 0n,
			chargeAtomDepositFraction ? tripleFees.atomDepositFraction : 0n,
		],
		minShareCost
	);
}

/**
 * Solves an atom create-with-initial-deposit value.
 *
 * The fixed atom cost is removed before protocol and atom-wallet fees; create
 * never charges the entry fee.
 */
export function grossUpAtomCreate(
	netInitialDeposit: bigint,
	fees: FeeSchedule,
	atomFees: AtomFees,
	atomCost: bigint
): GrossDepositQuote {
	return grossUpFeeBase(
		netInitialDeposit,
		fees.denominator,
		[fees.protocolFee, atomFees.atomWalletDepositFee],
		atomCost
	);
}

/**
 * Solves a triple create-with-initial-deposit value.
 *
 * The fixed triple cost is removed before percentage fees; create never
 * charges the entry fee.
 */
export function grossUpTripleCreate(
	netInitialDeposit: bigint,
	fees: FeeSchedule,
	tripleFees: TripleFees,
	chargeAtomDepositFraction: boolean,
	tripleCost: bigint
): GrossDepositQuote {
	return grossUpFeeBase(
		netInitialDeposit,
		fees.denominator,
		[fees.protocolFee, chargeAtomDepositFraction ? tripleFees.atomDepositFraction : 0n],
		tripleCost
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

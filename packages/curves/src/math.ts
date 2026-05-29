/**
 * WAD-scaled arithmetic helpers for bonding curve math.
 *
 * All functions operate on native `bigint` values and mirror the rounding
 * semantics of Solidity's UD60x18 / FixedPointMathLib used in the on-chain
 * contracts. WAD = 10^18.
 */

/** 1e18 — the WAD unit used for fixed-point arithmetic. */
export const WAD = 10n ** 18n;

// ---------------------------------------------------------------------------
// Core mul / div with explicit rounding
// ---------------------------------------------------------------------------

/** (a * b) / denominator — rounds toward zero (down for positive values). */
export function mulDivDown(a: bigint, b: bigint, denominator: bigint): bigint {
	if (denominator <= 0n) {
		throw new Error('Denominator must be greater than zero.');
	}
	return (a * b) / denominator;
}

/** (a * b + denominator - 1) / denominator — rounds away from zero (up). */
export function mulDivUp(a: bigint, b: bigint, denominator: bigint): bigint {
	if (denominator <= 0n) {
		throw new Error('Denominator must be greater than zero.');
	}
	if (a === 0n || b === 0n) {
		return 0n;
	}
	return (a * b + denominator - 1n) / denominator;
}

// ---------------------------------------------------------------------------
// WAD-scaled mul / div
// ---------------------------------------------------------------------------

/** a * b / WAD — rounded down. */
export function mulWadDown(a: bigint, b: bigint): bigint {
	return mulDivDown(a, b, WAD);
}

/** a * b / WAD — rounded up. */
export function mulWadUp(a: bigint, b: bigint): bigint {
	return mulDivUp(a, b, WAD);
}

/** a * WAD / b — rounded down. */
export function divWadDown(a: bigint, b: bigint): bigint {
	if (b <= 0n) {
		throw new Error('Divisor must be greater than zero.');
	}
	return (a * WAD) / b;
}

/** a * WAD / b — rounded up. */
export function divWadUp(a: bigint, b: bigint): bigint {
	if (b <= 0n) {
		throw new Error('Divisor must be greater than zero.');
	}
	if (a === 0n) {
		return 0n;
	}
	return (a * WAD + b - 1n) / b;
}

// ---------------------------------------------------------------------------
// Square / sqrt
// ---------------------------------------------------------------------------

/** Integer square root using Newton's method (Babylonian). */
export function sqrt(value: bigint): bigint {
	if (value < 0n) {
		throw new Error('Cannot compute square root of a negative value.');
	}
	if (value < 2n) {
		return value;
	}

	let x0 = value;
	let x1 = (x0 + 1n) >> 1n;

	while (x1 < x0) {
		x0 = x1;
		x1 = (x1 + value / x1) >> 1n;
	}

	return x0;
}

/** sqrt(value * WAD) — UD60x18-compatible square root. */
export function sqrtWad(value: bigint): bigint {
	if (value < 0n) {
		throw new Error('Cannot compute square root of a negative value.');
	}
	return sqrt(value * WAD);
}

/** value^2 / WAD — rounded down. */
export function squareWadDown(value: bigint): bigint {
	return mulWadDown(value, value);
}

/** value^2 / WAD — rounded up. */
export function squareWadUp(value: bigint): bigint {
	return mulWadUp(value, value);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Throws if slope is not a positive, even WAD-scaled integer. */
export function requirePositiveEvenSlope(slope: bigint): void {
	if (slope <= 0n || slope % 2n !== 0n) {
		throw new Error('Slope must be a positive, even WAD-scaled integer.');
	}
}

// ---------------------------------------------------------------------------
// Fee helper
// ---------------------------------------------------------------------------

/**
 * Mirrors `MultiVault._feeOnRaw()`: mulDivUp(amount, fee, denominator).
 * Returns the fee amount (not the remainder).
 */
export function feeOnRaw(amount: bigint, fee: bigint, denominator: bigint): bigint {
	return mulDivUp(amount, fee, denominator);
}

// ---------------------------------------------------------------------------
// Market cap
// ---------------------------------------------------------------------------

/** totalShares * sharePrice / WAD — market capitalisation of a vault. */
export function marketCap(totalShares: bigint, sharePrice: bigint): bigint {
	return mulDivDown(totalShares, sharePrice, WAD);
}

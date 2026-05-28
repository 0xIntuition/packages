/**
 * ProgressiveCurve — bonding curve with slope-based pricing (no offset).
 *
 * Price increases linearly with supply: price = totalShares * slope.
 * This is equivalent to OffsetProgressiveCurve with offset = 0.
 * The area under the price curve gives the assets/shares relationship.
 */

import {
	divWadDown,
	divWadUp,
	mulWadDown,
	mulWadUp,
	requirePositiveEvenSlope,
	sqrtWad,
	squareWadDown,
	squareWadUp,
} from './math';
import type { Curve, CurveState, ProgressiveCurveConfig } from './types';

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function getHalfSlope(config: ProgressiveCurveConfig): bigint {
	requirePositiveEvenSlope(config.slope);
	return config.slope / 2n;
}

// ---------------------------------------------------------------------------
// Core conversions
// ---------------------------------------------------------------------------

/** Convert assets to shares on the progressive curve. Rounds down. */
export function progressiveConvertToShares(
	assets: bigint,
	state: CurveState,
	config: ProgressiveCurveConfig
): bigint {
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares;
	const inner = squareWadDown(s) + divWadDown(assets, halfSlope);
	return sqrtWad(inner) - s;
}

/** Convert shares to assets on the progressive curve. Rounds down. */
export function progressiveConvertToAssets(
	shares: bigint,
	state: CurveState,
	config: ProgressiveCurveConfig
): bigint {
	if (shares > state.totalShares) {
		throw new Error('shares cannot exceed totalShares.');
	}
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares;
	const sNext = s - shares;
	const area = squareWadDown(s) - squareWadDown(sNext);
	return mulWadDown(area, halfSlope);
}

// ---------------------------------------------------------------------------
// Preview functions
// ---------------------------------------------------------------------------

/** How many shares for depositing `assets`? Rounds down. */
export function progressivePreviewDeposit(
	assets: bigint,
	state: CurveState,
	config: ProgressiveCurveConfig
): bigint {
	return progressiveConvertToShares(assets, state, config);
}

/** How many assets for redeeming `shares`? Rounds down. */
export function progressivePreviewRedeem(
	shares: bigint,
	state: CurveState,
	config: ProgressiveCurveConfig
): bigint {
	return progressiveConvertToAssets(shares, state, config);
}

/** How many assets to mint exactly `shares`? Rounds up. */
export function progressivePreviewMint(
	shares: bigint,
	state: CurveState,
	config: ProgressiveCurveConfig
): bigint {
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares;
	const sNext = s + shares;
	const area = squareWadUp(sNext) - squareWadDown(s);
	return mulWadUp(area, halfSlope);
}

/** How many shares to burn to withdraw exactly `assets`? Rounds up. */
export function progressivePreviewWithdraw(
	assets: bigint,
	state: CurveState,
	config: ProgressiveCurveConfig
): bigint {
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares;
	const maxAssets = mulWadDown(squareWadDown(s), halfSlope);
	if (assets > maxAssets) {
		throw new Error('assets cannot exceed redeemable assets at current curve state.');
	}
	const inner = squareWadDown(s) - divWadUp(assets, halfSlope);
	return s - sqrtWad(inner);
}

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------

/** Current price of 1 WAD share: totalShares * slope / WAD. */
export function progressiveCurrentPrice(state: CurveState, config: ProgressiveCurveConfig): bigint {
	requirePositiveEvenSlope(config.slope);
	return mulWadDown(state.totalShares, config.slope);
}

// ---------------------------------------------------------------------------
// Curve object
// ---------------------------------------------------------------------------

/** Creates a ProgressiveCurve implementing the Curve interface. */
export function createProgressiveCurve(config: ProgressiveCurveConfig): Curve {
	return {
		previewDeposit: (assets, state) => progressivePreviewDeposit(assets, state, config),
		previewRedeem: (shares, state) => progressivePreviewRedeem(shares, state, config),
		previewMint: (shares, state) => progressivePreviewMint(shares, state, config),
		previewWithdraw: (assets, state) => progressivePreviewWithdraw(assets, state, config),
		convertToShares: (assets, state) => progressiveConvertToShares(assets, state, config),
		convertToAssets: (shares, state) => progressiveConvertToAssets(shares, state, config),
		currentPrice: (state) => progressiveCurrentPrice(state, config),
	};
}

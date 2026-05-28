/**
 * OffsetProgressiveCurve — bonding curve with slope + offset.
 *
 * Price at supply S = (S + offset) * slope.
 * The offset shifts the curve so there is a non-zero starting price.
 * Area under the curve (integral) relates assets to shares.
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
import type { Curve, CurveState, OffsetProgressiveCurveConfig } from './types';

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function getHalfSlope(config: OffsetProgressiveCurveConfig): bigint {
	requirePositiveEvenSlope(config.slope);
	return config.slope / 2n;
}

// ---------------------------------------------------------------------------
// Core conversions
// ---------------------------------------------------------------------------

/** Convert assets to shares on the offset-progressive curve. Rounds down. */
export function offsetProgressiveConvertToShares(
	assets: bigint,
	state: CurveState,
	config: OffsetProgressiveCurveConfig
): bigint {
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares + config.offset;
	const inner = squareWadDown(s) + divWadDown(assets, halfSlope);
	return sqrtWad(inner) - s;
}

/** Convert shares to assets on the offset-progressive curve. Rounds down. */
export function offsetProgressiveConvertToAssets(
	shares: bigint,
	state: CurveState,
	config: OffsetProgressiveCurveConfig
): bigint {
	if (shares > state.totalShares) {
		throw new Error('shares cannot exceed totalShares.');
	}
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares + config.offset;
	const sNext = s - shares;
	const area = squareWadDown(s) - squareWadDown(sNext);
	return mulWadDown(area, halfSlope);
}

// ---------------------------------------------------------------------------
// Preview functions
// ---------------------------------------------------------------------------

/** How many shares for depositing `assets`? Rounds down. */
export function offsetProgressivePreviewDeposit(
	assets: bigint,
	state: CurveState,
	config: OffsetProgressiveCurveConfig
): bigint {
	return offsetProgressiveConvertToShares(assets, state, config);
}

/** How many assets for redeeming `shares`? Rounds down. */
export function offsetProgressivePreviewRedeem(
	shares: bigint,
	state: CurveState,
	config: OffsetProgressiveCurveConfig
): bigint {
	return offsetProgressiveConvertToAssets(shares, state, config);
}

/** How many assets to mint exactly `shares`? Rounds up. */
export function offsetProgressivePreviewMint(
	shares: bigint,
	state: CurveState,
	config: OffsetProgressiveCurveConfig
): bigint {
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares + config.offset;
	const sNext = s + shares;
	const area = squareWadUp(sNext) - squareWadDown(s);
	return mulWadUp(area, halfSlope);
}

/** How many shares to burn to withdraw exactly `assets`? Rounds up. */
export function offsetProgressivePreviewWithdraw(
	assets: bigint,
	state: CurveState,
	config: OffsetProgressiveCurveConfig
): bigint {
	const halfSlope = getHalfSlope(config);
	const s = state.totalShares + config.offset;
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

/** Current price: (totalShares + offset) * slope / WAD. */
export function offsetProgressiveCurrentPrice(
	state: CurveState,
	config: OffsetProgressiveCurveConfig
): bigint {
	requirePositiveEvenSlope(config.slope);
	return mulWadDown(state.totalShares + config.offset, config.slope);
}

// ---------------------------------------------------------------------------
// Curve object
// ---------------------------------------------------------------------------

/** Creates an OffsetProgressiveCurve implementing the Curve interface. */
export function createOffsetProgressiveCurve(config: OffsetProgressiveCurveConfig): Curve {
	return {
		previewDeposit: (assets, state) => offsetProgressivePreviewDeposit(assets, state, config),
		previewRedeem: (shares, state) => offsetProgressivePreviewRedeem(shares, state, config),
		previewMint: (shares, state) => offsetProgressivePreviewMint(shares, state, config),
		previewWithdraw: (assets, state) => offsetProgressivePreviewWithdraw(assets, state, config),
		convertToShares: (assets, state) => offsetProgressiveConvertToShares(assets, state, config),
		convertToAssets: (shares, state) => offsetProgressiveConvertToAssets(shares, state, config),
		currentPrice: (state) => offsetProgressiveCurrentPrice(state, config),
	};
}

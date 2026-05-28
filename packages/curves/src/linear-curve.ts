/**
 * LinearCurve — simple proportional bonding curve.
 *
 * shares/assets maintain a constant ratio. First depositor gets 1:1.
 * Deposit/redeem round down (favor protocol), mint/withdraw round up.
 */

import { mulDivDown, mulDivUp, WAD } from './math';
import type { Curve, CurveState } from './types';

// ---------------------------------------------------------------------------
// Core conversions
// ---------------------------------------------------------------------------

/** Convert assets to shares using the current ratio. Rounds down. */
export function linearConvertToShares(assets: bigint, state: CurveState): bigint {
	const { totalAssets, totalShares } = state;
	if (totalShares === 0n) {
		return assets;
	}
	if (totalAssets === 0n) {
		throw new Error('totalAssets must be greater than zero when totalShares is non-zero.');
	}
	return mulDivDown(assets, totalShares, totalAssets);
}

/** Convert shares to assets using the current ratio. Rounds down. */
export function linearConvertToAssets(shares: bigint, state: CurveState): bigint {
	const { totalAssets, totalShares } = state;
	if (totalShares === 0n) {
		return shares;
	}
	if (shares > totalShares) {
		throw new Error('shares cannot exceed totalShares.');
	}
	return mulDivDown(shares, totalAssets, totalShares);
}

// ---------------------------------------------------------------------------
// Preview functions
// ---------------------------------------------------------------------------

/** How many shares for depositing `assets`? Rounds down. */
export function linearPreviewDeposit(assets: bigint, state: CurveState): bigint {
	return linearConvertToShares(assets, state);
}

/** How many assets for redeeming `shares`? Rounds down. */
export function linearPreviewRedeem(shares: bigint, state: CurveState): bigint {
	return linearConvertToAssets(shares, state);
}

/** How many assets to mint exactly `shares`? Rounds up. */
export function linearPreviewMint(shares: bigint, state: CurveState): bigint {
	const { totalAssets, totalShares } = state;
	if (totalShares === 0n) {
		return shares;
	}
	if (totalAssets === 0n) {
		throw new Error('totalAssets must be greater than zero when totalShares is non-zero.');
	}
	return mulDivUp(shares, totalAssets, totalShares);
}

/** How many shares to burn to withdraw exactly `assets`? Rounds up. */
export function linearPreviewWithdraw(assets: bigint, state: CurveState): bigint {
	const { totalAssets, totalShares } = state;
	if (totalShares === 0n) {
		return assets;
	}
	if (assets > totalAssets) {
		throw new Error('assets cannot exceed totalAssets.');
	}
	return mulDivUp(assets, totalShares, totalAssets);
}

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------

/** Current price of 1 WAD share in assets. */
export function linearCurrentPrice(state: CurveState): bigint {
	return linearConvertToAssets(WAD, state);
}

// ---------------------------------------------------------------------------
// Curve object
// ---------------------------------------------------------------------------

/** Creates a LinearCurve implementing the Curve interface. */
export function createLinearCurve(): Curve {
	return {
		previewDeposit: linearPreviewDeposit,
		previewRedeem: linearPreviewRedeem,
		previewMint: linearPreviewMint,
		previewWithdraw: linearPreviewWithdraw,
		convertToShares: linearConvertToShares,
		convertToAssets: linearConvertToAssets,
		currentPrice: linearCurrentPrice,
	};
}

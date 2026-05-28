/**
 * Market capitalisation calculation from curve state.
 */

import { marketCap as marketCapMath } from './math';
import type { CurveState } from './types';

/**
 * Calculate the market cap of a vault given its state and the current share price.
 *
 * marketCap = totalShares * sharePrice / WAD
 *
 * @param state - current vault state (totalAssets, totalShares)
 * @param getCurrentPrice - function that returns the WAD-scaled share price for the state
 */
export function marketCapFromState(
	state: CurveState,
	getCurrentPrice: (state: CurveState) => bigint
): bigint {
	const sharePrice = getCurrentPrice(state);
	return marketCapMath(state.totalShares, sharePrice);
}

/**
 * @deprecated Use `@0xintuition/curves` directly. This module re-exports for backwards compatibility.
 */

import type { CurveState, OffsetProgressiveCurveConfig } from '@0xintuition/curves';
import {
	offsetProgressiveConvertToAssets,
	offsetProgressiveConvertToShares,
	offsetProgressiveCurrentPrice,
	offsetProgressivePreviewDeposit,
	offsetProgressivePreviewMint,
	offsetProgressivePreviewRedeem,
	offsetProgressivePreviewWithdraw,
} from '@0xintuition/curves';

export type OffsetProgressiveCurveState = CurveState;
export type { OffsetProgressiveCurveConfig };

export {
	offsetProgressiveConvertToShares as offsetProgressiveCurveConvertToShares,
	offsetProgressiveConvertToAssets as offsetProgressiveCurveConvertToAssets,
	offsetProgressivePreviewDeposit as offsetProgressiveCurvePreviewDeposit,
	offsetProgressivePreviewRedeem as offsetProgressiveCurvePreviewRedeem,
	offsetProgressivePreviewMint as offsetProgressiveCurvePreviewMint,
	offsetProgressivePreviewWithdraw as offsetProgressiveCurvePreviewWithdraw,
	offsetProgressiveCurrentPrice as offsetProgressiveCurveCurrentPrice,
};

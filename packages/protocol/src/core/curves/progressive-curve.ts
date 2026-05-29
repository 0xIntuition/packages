/**
 * @deprecated Use `@0xintuition/curves` directly. This module re-exports for backwards compatibility.
 */

import type { CurveState, ProgressiveCurveConfig } from '@0xintuition/curves';
import {
	progressiveConvertToAssets,
	progressiveConvertToShares,
	progressiveCurrentPrice,
	progressivePreviewDeposit,
	progressivePreviewMint,
	progressivePreviewRedeem,
	progressivePreviewWithdraw,
} from '@0xintuition/curves';

export type ProgressiveCurveState = CurveState;
export type { ProgressiveCurveConfig };

export {
	progressiveConvertToShares as progressiveCurveConvertToShares,
	progressiveConvertToAssets as progressiveCurveConvertToAssets,
	progressivePreviewDeposit as progressiveCurvePreviewDeposit,
	progressivePreviewRedeem as progressiveCurvePreviewRedeem,
	progressivePreviewMint as progressiveCurvePreviewMint,
	progressivePreviewWithdraw as progressiveCurvePreviewWithdraw,
	progressiveCurrentPrice as progressiveCurveCurrentPrice,
};

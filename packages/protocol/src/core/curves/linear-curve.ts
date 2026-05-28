/**
 * @deprecated Use `@0xintuition/curves` directly. This module re-exports for backwards compatibility.
 */

import type { CurveState } from '@0xintuition/curves';
import {
	linearConvertToAssets,
	linearConvertToShares,
	linearCurrentPrice,
	linearPreviewDeposit,
	linearPreviewMint,
	linearPreviewRedeem,
	linearPreviewWithdraw,
} from '@0xintuition/curves';

export type LinearCurveState = CurveState;

export {
	linearConvertToShares as linearCurveConvertToShares,
	linearConvertToAssets as linearCurveConvertToAssets,
	linearPreviewDeposit as linearCurvePreviewDeposit,
	linearPreviewRedeem as linearCurvePreviewRedeem,
	linearPreviewMint as linearCurvePreviewMint,
	linearPreviewWithdraw as linearCurvePreviewWithdraw,
	linearCurrentPrice as linearCurveCurrentPrice,
};

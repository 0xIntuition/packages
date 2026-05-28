// Types

// Fee simulation
export {
	previewAtomDeposit,
	previewDepositWithFees,
	previewRedeemWithFees,
	previewTripleDeposit,
	totalFees,
} from './fees';
// Linear curve
export {
	createLinearCurve,
	linearConvertToAssets,
	linearConvertToShares,
	linearCurrentPrice,
	linearPreviewDeposit,
	linearPreviewMint,
	linearPreviewRedeem,
	linearPreviewWithdraw,
} from './linear-curve';
// Market cap
export { marketCapFromState } from './market-cap';
// Math primitives
export {
	divWadDown,
	divWadUp,
	feeOnRaw,
	marketCap,
	mulDivDown,
	mulDivUp,
	mulWadDown,
	mulWadUp,
	requirePositiveEvenSlope,
	sqrt,
	sqrtWad,
	squareWadDown,
	squareWadUp,
	WAD,
} from './math';

// Offset progressive curve
export {
	createOffsetProgressiveCurve,
	offsetProgressiveConvertToAssets,
	offsetProgressiveConvertToShares,
	offsetProgressiveCurrentPrice,
	offsetProgressivePreviewDeposit,
	offsetProgressivePreviewMint,
	offsetProgressivePreviewRedeem,
	offsetProgressivePreviewWithdraw,
} from './offset-progressive-curve';
// Progressive curve
export {
	createProgressiveCurve,
	progressiveConvertToAssets,
	progressiveConvertToShares,
	progressiveCurrentPrice,
	progressivePreviewDeposit,
	progressivePreviewMint,
	progressivePreviewRedeem,
	progressivePreviewWithdraw,
} from './progressive-curve';
export type {
	AtomFees,
	Curve,
	CurveState,
	DepositQuote,
	FeeBreakdown,
	FeeSchedule,
	OffsetProgressiveCurveConfig,
	ProgressiveCurveConfig,
	RedeemQuote,
	TripleFees,
} from './types';

/**
 * Shared types for the curves package.
 *
 * Mirrors the Rust `CurveState`, `FeeSchedule`, and quote types so that
 * TypeScript consumers have the same API surface as the backend crate.
 */

// ---------------------------------------------------------------------------
// Curve state
// ---------------------------------------------------------------------------

/** Total assets and shares tracked by a vault. */
export type CurveState = {
	totalAssets: bigint;
	totalShares: bigint;
};

// ---------------------------------------------------------------------------
// Curve config
// ---------------------------------------------------------------------------

/** Config for OffsetProgressiveCurve. */
export type OffsetProgressiveCurveConfig = {
	offset: bigint;
	slope: bigint;
};

/** Config for ProgressiveCurve (offset-progressive with offset = 0). */
export type ProgressiveCurveConfig = {
	slope: bigint;
};

// ---------------------------------------------------------------------------
// Curve interface
// ---------------------------------------------------------------------------

/**
 * Unified curve interface matching the Rust `Curve` trait.
 * All functions take state as a param and return bigint results.
 */
export type Curve = {
	previewDeposit: (assets: bigint, state: CurveState) => bigint;
	previewRedeem: (shares: bigint, state: CurveState) => bigint;
	previewMint: (shares: bigint, state: CurveState) => bigint;
	previewWithdraw: (assets: bigint, state: CurveState) => bigint;
	convertToShares: (assets: bigint, state: CurveState) => bigint;
	convertToAssets: (shares: bigint, state: CurveState) => bigint;
	currentPrice: (state: CurveState) => bigint;
};

// ---------------------------------------------------------------------------
// Fee types
// ---------------------------------------------------------------------------

/** Fee schedule matching `VaultFees` + MultiVault config. */
export type FeeSchedule = {
	denominator: bigint;
	protocolFee: bigint;
	entryFee: bigint;
	exitFee: bigint;
};

/** Atom-specific fees from `AtomConfig`. */
export type AtomFees = {
	/** `atomWalletDepositFee` — percentage of deposit for the atom wallet. */
	atomWalletDepositFee: bigint;
};

/** Triple-specific fees from `TripleConfig`. */
export type TripleFees = {
	/** `atomDepositFractionForTriple` — percentage split among 3 underlying atoms. */
	atomDepositFraction: bigint;
};

/** Breakdown of individual fee components. */
export type FeeBreakdown = {
	protocolFee: bigint;
	entryFee: bigint;
	exitFee: bigint;
	atomWalletFee: bigint;
	atomDepositFraction: bigint;
};

// ---------------------------------------------------------------------------
// Quote types
// ---------------------------------------------------------------------------

/** Result of a fee-aware deposit simulation. */
export type DepositQuote = {
	shares: bigint;
	assetsBeforeFees: bigint;
	assetsAfterFees: bigint;
	fees: FeeBreakdown;
};

/** Result of a fee-aware redeem simulation. */
export type RedeemQuote = {
	shares: bigint;
	assetsBeforeFees: bigint;
	assetsAfterFees: bigint;
	fees: FeeBreakdown;
};

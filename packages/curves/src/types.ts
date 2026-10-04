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
// Dynamic-fee curve config
// ---------------------------------------------------------------------------

/** Tunable tier + fee schedule for DynamicFeeFlatPriceCurve. Mirrors the on-chain `DynamicFeeConfig` struct field-for-field. */
export type DynamicFeeConfig = {
	width0: bigint;
	tierCount: bigint;
	growthGBps: bigint;
	depositBaseBps: bigint;
	depositGrowthBps: bigint;
	depositCapBps: bigint;
	fulcrumAlpha: bigint;
	kernelSpread: bigint;
	withdrawalBaseBps: bigint;
	withdrawalGrowthBps: bigint;
	withdrawalCapBps: bigint;
	withdrawalToFulcrumTiersBps: bigint;
	depositToPriorTierBps: bigint;
	minEligibleTierStake: bigint;
};

/** Sparse per-tier manual fee override. Mirrors the on-chain `TierFeeOverride` struct. */
export type DynamicFeeTierOverride = {
	isSet: boolean;
	depositFeeBps: bigint;
	withdrawalFeeBps: bigint;
};

/**
 * One rung of the tier ladder. `upperEdge` / `width` are `null` on the top
 * tier: on-chain, `_tierOf` returns `tierCount - 1` for any assets at or past
 * the top tier's nominal edge, so the top tier has no enforced ceiling —
 * `null` communicates "unbounded" rather than a real (but inert) closed-form
 * number a caller could mistake for a cap.
 */
export type DynamicFeeTierLadderEntry = {
	tier: bigint;
	upperEdge: bigint | null;
	width: bigint | null;
	depositFeeBps: bigint;
	withdrawalFeeBps: bigint;
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

/** Result of solving the gross transaction value required for an exact net deposit. */
export type GrossDepositQuote = {
	/** Total wallet debit, including any fixed or first-vault cost. */
	grossAssets: bigint;
	/** Percentage-fee base after any fixed or first-vault cost. */
	feeBase: bigint;
	/** Exact amount left after all applicable percentage fees. */
	assetsAfterFees: bigint;
	/** One-wei increments applied after the closed-form starting estimate; high fees may need many. */
	fixupIterations: number;
};

/** Result of a fee-aware redeem simulation. */
export type RedeemQuote = {
	shares: bigint;
	assetsBeforeFees: bigint;
	assetsAfterFees: bigint;
	fees: FeeBreakdown;
};

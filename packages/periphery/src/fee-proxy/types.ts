/** Mirrors the on-chain `FeeGuard` struct — the caller's per-call front-run guard. */
export type FeeGuard = {
	maxFeeBps: bigint;
	maxFixedFee: bigint;
};

/** Mirrors the on-chain `FeeConfig` struct — an affiliate's per-side bps and flat fees. */
export type FeeConfig = {
	depositBps: bigint;
	creationBps: bigint;
	depositFixedFee: bigint;
	creationFixedFee: bigint;
};

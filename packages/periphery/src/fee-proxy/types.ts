/** Mirrors the on-chain `FeeGuard` struct — the caller's per-call front-run guard. */
export type FeeGuard = {
	maxFeeBps: bigint;
	maxFixedFee: bigint;
};

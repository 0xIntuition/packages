/** FeeProxy's basis-points denominator (`BPS_DIVISOR`): `10_000` bps is 100%. */
export const FEE_PROXY_BPS_DIVISOR = 10_000n;

/** Safety bound on the search steps `feeProxyGrossUpForTargets` may take; never reached in practice. */
const MAX_GROSS_UP_BUMPS = 100_000;

/** The fee and forwarded split of one FeeProxy routing call, mirrored from `_setupRoutingFlow`. */
export type FeeProxyRoutingSplit = {
	totalGrossAssets: bigint;
	affiliateFee: bigint;
	totalForwardedAssets: bigint;
	/** What MultiVault receives per leg, in leg order. */
	forwardedAssets: bigint[];
};

/** A gross-up result: the per-leg gross to send and the routing split it produces. */
export type FeeProxyGrossUp = FeeProxyRoutingSplit & {
	/** Per-leg gross assets to pass to the `*Via` call. */
	grossAssets: bigint[];
	/** The per-leg forwarded amounts the gross-up had to reach; each leg gets at least its target. */
	targets: bigint[];
};

function assertFeeParams(bps: bigint, fixedFee: bigint): void {
	if (bps < 0n || bps > FEE_PROXY_BPS_DIVISOR) {
		throw new Error(`bps must be between 0 and ${FEE_PROXY_BPS_DIVISOR}, got ${bps}.`);
	}
	if (fixedFee < 0n) {
		throw new Error(`fixedFee must not be negative, got ${fixedFee}.`);
	}
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
	return (numerator + denominator - 1n) / denominator;
}

/**
 * Mirrors FeeProxy `_calcFee`: `grossAssets * bps / 10_000` (floored) plus the flat fee. The flat
 * fee is charged once per call, on the summed gross of every leg.
 * @param grossAssets The pre-fee gross for the whole call.
 * @param bps The affiliate's bps on the side being used.
 * @param fixedFee The affiliate's flat fee on the side being used (TRUST wei).
 * @returns The affiliate fee.
 */
export function feeProxyCalcFee(grossAssets: bigint, bps: bigint, fixedFee: bigint): bigint {
	assertFeeParams(bps, fixedFee);
	return (grossAssets * bps) / FEE_PROXY_BPS_DIVISOR + fixedFee;
}

/**
 * Mirrors FeeProxy `_allocate`: splits the forwarded total across legs pro rata to their gross,
 * flooring every leg but the last, which takes the rounding dust so the legs sum exactly.
 * @param grossAssets Per-leg gross, in leg order.
 * @param totalForwardedAssets The forwarded total to split.
 * @returns The forwarded amount per leg.
 */
export function feeProxyAllocate(
	grossAssets: readonly bigint[],
	totalForwardedAssets: bigint
): bigint[] {
	if (grossAssets.length === 0) {
		throw new Error('At least one leg is required.');
	}
	let totalGrossAssets = 0n;
	for (const gross of grossAssets) {
		totalGrossAssets += gross;
	}
	if (totalGrossAssets === 0n) {
		throw new Error('Total gross assets must be greater than 0.');
	}

	const forwardedAssets: bigint[] = [];
	let accumulated = 0n;
	for (const gross of grossAssets.slice(0, -1)) {
		const piece = (gross * totalForwardedAssets) / totalGrossAssets;
		forwardedAssets.push(piece);
		accumulated += piece;
	}
	forwardedAssets.push(totalForwardedAssets - accumulated);
	return forwardedAssets;
}

/**
 * Mirrors the fee maths of one FeeProxy routing call (`depositVia`, `depositBatchVia` and the
 * create entry points): sum the legs, take one fee on the total, split the rest with `_allocate`.
 * Throws where the contract reverts: a zero leg (`FeeProxy_ZeroAssets`) or a fee at or above the
 * gross (`FeeProxy_FeeExceedsGross`).
 * @param inputs Per-leg gross and the affiliate's bps and flat fee for the side being used.
 * @returns The total gross, the affiliate fee, and the forwarded total and per-leg split.
 */
export function feeProxySplitRouting(inputs: {
	grossAssets: readonly bigint[];
	bps: bigint;
	fixedFee: bigint;
}): FeeProxyRoutingSplit {
	const { grossAssets, bps, fixedFee } = inputs;
	if (grossAssets.length === 0) {
		throw new Error('At least one leg is required.');
	}

	let totalGrossAssets = 0n;
	for (const [index, gross] of grossAssets.entries()) {
		if (gross <= 0n) {
			throw new Error(`Leg ${index} gross must be greater than 0 (FeeProxy_ZeroAssets).`);
		}
		totalGrossAssets += gross;
	}

	const affiliateFee = feeProxyCalcFee(totalGrossAssets, bps, fixedFee);
	if (affiliateFee >= totalGrossAssets) {
		throw new Error(
			`Affiliate fee ${affiliateFee} is not below the gross ${totalGrossAssets} (FeeProxy_FeeExceedsGross).`
		);
	}
	const totalForwardedAssets = totalGrossAssets - affiliateFee;

	return {
		totalGrossAssets,
		affiliateFee,
		totalForwardedAssets,
		forwardedAssets: feeProxyAllocate(grossAssets, totalForwardedAssets),
	};
}

function gcd(a: bigint, b: bigint): bigint {
	let x = a;
	let y = b;
	while (y !== 0n) {
		[x, y] = [y, x % y];
	}
	return x;
}

/**
 * Inverts the FeeProxy fee: finds per-leg gross amounts that give every forwarded leg at least its
 * target after the affiliate fee and `_allocate`, and keep doing so if the affiliate lowers its bps
 * or its flat fee before the call lands (the `FeeGuard` lets decreases through).
 *
 * For a total `G` forwarding `F`, every leg gets `ceil(target * G / F)` and the last leg also takes
 * whatever is left. The result is the least `G` from `G - floor(G * bps / 10_000) - fixedFee >=
 * sum(targets)` upward at which these per-leg amounts fit in `G`. Then every leg's share
 * `gross * F' / G` is at least its target for any forwarded total `F' >= F`, which is what a lower
 * fee produces; `_allocate` floors the leading legs to at least their targets and the last leg gets
 * at least its share. A leg can therefore receive more than its target (the last leg most), and the
 * total can sit up to about one forwarded wei per leg above the least total that only works at the
 * quoted fee. The result is re-run through `feeProxySplitRouting` and must meet every target or this
 * throws.
 * @param inputs The forwarded amount each leg must reach, and the affiliate's bps and flat fee.
 * @returns The per-leg gross to send and the split it produces at the quoted fee.
 */
export function feeProxyGrossUpForTargets(inputs: {
	targets: readonly bigint[];
	bps: bigint;
	fixedFee: bigint;
}): FeeProxyGrossUp {
	const { targets, bps, fixedFee } = inputs;
	assertFeeParams(bps, fixedFee);
	if (targets.length === 0) {
		throw new Error('At least one target is required.');
	}
	if (bps === FEE_PROXY_BPS_DIVISOR) {
		throw new Error('A 100% fee leaves nothing to forward; no gross reaches the targets.');
	}

	let totalTarget = 0n;
	let targetsGcd = 0n;
	for (const [index, target] of targets.entries()) {
		if (target <= 0n) {
			throw new Error(`Target ${index} must be greater than 0.`);
		}
		totalTarget += target;
		targetsGcd = gcd(targetsGcd, target);
	}

	const lastIndex = targets.length - 1;
	const netDivisor = FEE_PROXY_BPS_DIVISOR - bps;
	// Least G with ceil(G * (D - bps) / D) >= totalTarget + fixedFee, so F(G) == totalTarget.
	let totalGrossAssets = ((totalTarget + fixedFee - 1n) * FEE_PROXY_BPS_DIVISOR) / netDivisor + 1n;

	for (let bump = 0; bump <= MAX_GROSS_UP_BUMPS; bump += 1) {
		const totalForwardedAssets =
			totalGrossAssets - feeProxyCalcFee(totalGrossAssets, bps, fixedFee);
		const grossAssets: bigint[] = [];
		let needed = 0n;
		for (const target of targets) {
			const gross = ceilDiv(target * totalGrossAssets, totalForwardedAssets);
			grossAssets.push(gross);
			needed += gross;
		}

		if (needed <= totalGrossAssets) {
			grossAssets[lastIndex] = (grossAssets[lastIndex] ?? 0n) + totalGrossAssets - needed;
			const split = feeProxySplitRouting({ grossAssets, bps, fixedFee });
			const meetsTargets = split.forwardedAssets.every(
				(forwarded, index) => forwarded >= (targets[index] ?? 0n)
			);
			if (meetsTargets) {
				return { ...split, grossAssets, targets: [...targets] };
			}
			totalGrossAssets += 1n;
			continue;
		}

		// While F stays the same, `G - needed` rises by at most one per extra wei of G, so the next
		// `needed - G - 1` totals fall short too. Never skip past the next total that forwards more.
		const nextForwardedStep =
			((totalForwardedAssets + fixedFee) * FEE_PROXY_BPS_DIVISOR) / netDivisor + 1n;
		let candidate = needed;
		if (totalForwardedAssets === totalTarget) {
			// With F equal to the targets' sum, the amounts fit only when every `target * G / F` is
			// whole, which needs G to be a multiple of `sum / gcd(targets)`.
			const period = totalTarget / targetsGcd;
			const nextMultiple = ceilDiv(totalGrossAssets + 1n, period) * period;
			if (nextMultiple > candidate) {
				candidate = nextMultiple;
			}
		}
		totalGrossAssets = candidate < nextForwardedStep ? candidate : nextForwardedStep;
	}

	throw new Error('Could not gross up the targets within the bump bound.');
}

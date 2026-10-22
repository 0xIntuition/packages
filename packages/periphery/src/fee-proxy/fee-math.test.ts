import { describe, expect, it } from 'vitest';

import {
	FEE_PROXY_BPS_DIVISOR,
	feeProxyAllocate,
	feeProxyCalcFee,
	feeProxyGrossUpForTargets,
	feeProxySplitRouting,
} from './fee-math';

const TRUST = 10n ** 18n;

/**
 * Deterministic xorshift so the property loops are reproducible. Each draw takes three fresh 32-bit
 * states, so small ranges (leg counts, fee choices) are not correlated with each other.
 */
function rng(seed: number) {
	let state = seed >>> 0 || 1;
	const step = (): bigint => {
		state ^= state << 13;
		state >>>= 0;
		state ^= state >>> 17;
		state ^= state << 5;
		state >>>= 0;
		return BigInt(state);
	};
	return (max: bigint): bigint => ((step() << 64n) | (step() << 32n) | step()) % max;
}

function forwardedTotal(gross: bigint, bps: bigint, fixedFee: bigint): bigint {
	return gross - feeProxyCalcFee(gross, bps, fixedFee);
}

/** The least total gross whose forwarded total reaches `totalTarget`: a lower bound for any split. */
function leastTotalForwarding(totalTarget: bigint, bps: bigint, fixedFee: bigint): bigint {
	return (
		((totalTarget + fixedFee - 1n) * FEE_PROXY_BPS_DIVISOR) / (FEE_PROXY_BPS_DIVISOR - bps) + 1n
	);
}

/** Whether every forwarded leg reaches its target when the call is charged `bps` and `fixedFee`. */
function coversTargets(
	grossAssets: readonly bigint[],
	targets: readonly bigint[],
	bps: bigint,
	fixedFee: bigint
): boolean {
	const split = feeProxySplitRouting({ grossAssets, bps, fixedFee });
	return split.forwardedAssets.every((forwarded, index) => forwarded >= (targets[index] ?? 0n));
}

/**
 * Smallest total gross for which ANY split of n legs reaches every target at the quoted fee, by
 * exhaustive search. Starts at the first total that forwards at least the targets' sum, a
 * necessary condition because the legs always sum to the forwarded total.
 */
function bruteForceMinimalTotal(targets: bigint[], bps: bigint, fixedFee: bigint): bigint {
	const totalTarget = targets.reduce((sum, target) => sum + target, 0n);
	const start = leastTotalForwarding(totalTarget, bps, fixedFee);
	for (let total = start; ; total += 1n) {
		const forwarded = forwardedTotal(total, bps, fixedFee);
		const search = (prefix: bigint[], remaining: bigint): boolean => {
			if (prefix.length === targets.length - 1) {
				if (remaining < 1n) {
					return false;
				}
				const legs = feeProxyAllocate([...prefix, remaining], forwarded);
				return legs.every((leg, index) => leg >= (targets[index] ?? 0n));
			}
			for (let gross = 1n; gross < remaining; gross += 1n) {
				if (search([...prefix, gross], remaining - gross)) {
					return true;
				}
			}
			return false;
		};
		if (search([], total)) {
			return total;
		}
	}
}

describe('feeProxyCalcFee / feeProxySplitRouting mirror FeeProxy', () => {
	it('floors the bps part and adds the fixed fee once', () => {
		expect(feeProxyCalcFee(9_999n, 1n, 0n)).toBe(0n);
		expect(feeProxyCalcFee(10_000n, 1n, 0n)).toBe(1n);
		expect(feeProxyCalcFee(123_456_789n * TRUST + 7n, 250n, TRUST / 100n)).toBe(
			((123_456_789n * TRUST + 7n) * 250n) / 10_000n + TRUST / 100n
		);
	});

	it('charges one fixed fee on the summed legs and splits the rest pro rata, dust to the last leg', () => {
		const split = feeProxySplitRouting({ grossAssets: [3n, 3n, 4n], bps: 1_000n, fixedFee: 1n });
		expect(split.totalGrossAssets).toBe(10n);
		expect(split.affiliateFee).toBe(2n);
		expect(split.totalForwardedAssets).toBe(8n);
		expect(split.forwardedAssets).toEqual([2n, 2n, 4n]);
	});

	it('rejects a zero leg and a fee at or above the gross, as the contract does', () => {
		expect(() => feeProxySplitRouting({ grossAssets: [1n, 0n], bps: 0n, fixedFee: 0n })).toThrow(
			/ZeroAssets/
		);
		expect(() => feeProxySplitRouting({ grossAssets: [5n], bps: 0n, fixedFee: 5n })).toThrow(
			/FeeExceedsGross/
		);
		expect(() =>
			feeProxySplitRouting({ grossAssets: [5n], bps: FEE_PROXY_BPS_DIVISOR, fixedFee: 0n })
		).toThrow(/FeeExceedsGross/);
	});

	it('allocation always sums to the forwarded total', () => {
		const next = rng(7);
		for (let run = 0; run < 2_000; run += 1) {
			const legs = Array.from({ length: Number(next(5n)) + 1 }, () => next(10n ** 24n) + 1n);
			const total = legs.reduce((sum, leg) => sum + leg, 0n);
			const forwarded = next(total + 1n);
			const split = feeProxyAllocate(legs, forwarded);
			expect(split.reduce((sum, leg) => sum + leg, 0n)).toBe(forwarded);
		}
	});
});

describe('feeProxyGrossUpForTargets', () => {
	it('with no fee the gross is the target', () => {
		const result = feeProxyGrossUpForTargets({ targets: [5n, 7n], bps: 0n, fixedFee: 0n });
		expect(result.grossAssets).toEqual([5n, 7n]);
		expect(result.affiliateFee).toBe(0n);
		expect(result.forwardedAssets).toEqual([5n, 7n]);
	});

	it('fixed fee only: one fixed fee on top, charged once per call', () => {
		const targets = [TRUST, 2n * TRUST, 3n * TRUST];
		const result = feeProxyGrossUpForTargets({ targets, bps: 0n, fixedFee: TRUST / 10n });
		// One fixed fee, plus at most one wei per leg so the split survives a fee cut.
		expect(result.totalGrossAssets >= 6n * TRUST + TRUST / 10n).toBe(true);
		expect(result.totalGrossAssets <= 6n * TRUST + TRUST / 10n + 3n).toBe(true);
		expect(result.affiliateFee).toBe(TRUST / 10n);
		expect(coversTargets(result.grossAssets, targets, 0n, TRUST / 10n)).toBe(true);
		expect(coversTargets(result.grossAssets, targets, 0n, 0n)).toBe(true);
	});

	it('a fee cut before inclusion cannot underfund the last leg (targets [2, 2, 2], 0 bps + 1 wei)', () => {
		const targets = [2n, 2n, 2n];
		const result = feeProxyGrossUpForTargets({ targets, bps: 0n, fixedFee: 1n });
		// The old split [3, 3, 1] forwarded [2, 2, 2] at the quoted fee but [3, 3, 1] once the fixed
		// fee dropped to 0, which the FeeGuard allows.
		expect(coversTargets(result.grossAssets, targets, 0n, 1n)).toBe(true);
		expect(coversTargets(result.grossAssets, targets, 0n, 0n)).toBe(true);
		expect(result.grossAssets).toEqual([3n, 3n, 3n]);
	});

	it('gives each leg at least its target, not exactly it (targets [1, 1, 1, 1], 0 bps + 1 wei)', () => {
		const targets = [1n, 1n, 1n, 1n];
		const result = feeProxyGrossUpForTargets({ targets, bps: 0n, fixedFee: 1n });
		expect(result.totalGrossAssets).toBe(8n);
		expect(result.grossAssets).toEqual([2n, 2n, 2n, 2n]);
		expect(result.forwardedAssets).toEqual([1n, 1n, 1n, 4n]);
		expect(coversTargets(result.grossAssets, targets, 0n, 0n)).toBe(true);
	});

	it('rejects a 100% fee, negative inputs and non-positive targets', () => {
		expect(() =>
			feeProxyGrossUpForTargets({ targets: [1n], bps: FEE_PROXY_BPS_DIVISOR, fixedFee: 0n })
		).toThrow(/100%/);
		expect(() => feeProxyGrossUpForTargets({ targets: [0n], bps: 0n, fixedFee: 0n })).toThrow(
			/greater than 0/
		);
		expect(() => feeProxyGrossUpForTargets({ targets: [1n], bps: -1n, fixedFee: 0n })).toThrow(
			/bps/
		);
		expect(() => feeProxyGrossUpForTargets({ targets: [], bps: 0n, fixedFee: 0n })).toThrow(
			/target/
		);
	});

	it('small values (n = 1, 2, 3): covers every target at every forwarded total a fee cut can produce', () => {
		const next = rng(11);
		for (let run = 0; run < 300; run += 1) {
			const legCount = Number(next(3n)) + 1;
			const targets = Array.from({ length: legCount }, () => next(12n) + 1n);
			const bps = [0n, 1n, 333n, 2_500n, 5_000n, 9_000n][Number(next(6n))] ?? 0n;
			const fixedFee = next(4n);
			const label = `targets ${targets} bps ${bps} fixed ${fixedFee}`;
			const result = feeProxyGrossUpForTargets({ targets, bps, fixedFee });

			// Any fee pair at or below the quoted one forwards a total in [F, G], so check them all.
			for (
				let forwarded = result.totalForwardedAssets;
				forwarded <= result.totalGrossAssets;
				forwarded += 1n
			) {
				const legs = feeProxyAllocate(result.grossAssets, forwarded);
				expect(
					legs.every((leg, index) => leg >= (targets[index] ?? 0n)),
					`${label} forwarded ${forwarded}`
				).toBe(true);
			}
			// Never below the least total that covers the targets at the quoted fee alone.
			expect(result.totalGrossAssets >= bruteForceMinimalTotal(targets, bps, fixedFee), label).toBe(
				true
			);
		}
	});

	it('property: every leg covers its target at the quoted fee and at any lower fee, within a small bound of the least total', () => {
		const next = rng(23);
		const bpsChoices = [0n, 1n, 99n, 100n, 250n, 1_000n, 4_999n, 9_999n];
		const fixedChoices = [0n, 1n, 2n, TRUST / 100n, TRUST, 10n * TRUST];
		for (let run = 0; run < 3_000; run += 1) {
			const legCount = Number(next(6n)) + 1;
			const magnitude = 10n ** (next(23n) + 1n);
			const targets = Array.from({ length: legCount }, () => next(magnitude) + 1n);
			const bps = bpsChoices[Number(next(BigInt(bpsChoices.length)))] ?? 0n;
			const fixedFee = fixedChoices[Number(next(BigInt(fixedChoices.length)))] ?? 0n;
			const totalTarget = targets.reduce((sum, target) => sum + target, 0n);
			const label = `targets ${targets} bps ${bps} fixed ${fixedFee}`;

			const result = feeProxyGrossUpForTargets({ targets, bps, fixedFee });
			const replay = feeProxySplitRouting({ grossAssets: result.grossAssets, bps, fixedFee });
			expect(replay).toEqual({
				totalGrossAssets: result.totalGrossAssets,
				affiliateFee: result.affiliateFee,
				totalForwardedAssets: result.totalForwardedAssets,
				forwardedAssets: result.forwardedAssets,
			});

			const lowerFees: [bigint, bigint][] = [
				[bps, fixedFee],
				[0n, 0n],
				[bps, 0n],
				[0n, fixedFee],
				[bps > 0n ? bps - 1n : 0n, fixedFee],
				[bps, fixedFee > 0n ? fixedFee - 1n : 0n],
				[next(bps + 1n), next(fixedFee + 1n)],
				[next(bps + 1n), next(fixedFee + 1n)],
			];
			for (const [lowerBps, lowerFixedFee] of lowerFees) {
				expect(
					coversTargets(result.grossAssets, targets, lowerBps, lowerFixedFee),
					`${label} lowered to ${lowerBps} bps + ${lowerFixedFee}`
				).toBe(true);
			}

			// The least total that forwards the targets' sum is a lower bound; the extra the cut-safe
			// split needs is at most one forwarded wei per leg, grossed up.
			const least = leastTotalForwarding(totalTarget, bps, fixedFee);
			const extraBound =
				(BigInt(legCount) * FEE_PROXY_BPS_DIVISOR + FEE_PROXY_BPS_DIVISOR - bps - 1n) /
				(FEE_PROXY_BPS_DIVISOR - bps);
			expect(result.totalGrossAssets >= least, label).toBe(true);
			expect(result.totalGrossAssets - least <= extraBound, label).toBe(true);
		}
	}, 30_000);

	it('rounding boundaries: targets around multiples of the bps denominator', () => {
		for (const bps of [1n, 3n, 7n, 250n, 9_999n]) {
			for (let target = 9_990n; target <= 10_010n; target += 1n) {
				const targets = [target, target + 1n];
				const result = feeProxyGrossUpForTargets({ targets, bps, fixedFee: 1n });
				expect(coversTargets(result.grossAssets, targets, bps, 1n)).toBe(true);
				expect(coversTargets(result.grossAssets, targets, 0n, 0n)).toBe(true);
				const least = leastTotalForwarding(2n * target + 1n, bps, 1n);
				const extraBound = (2n * FEE_PROXY_BPS_DIVISOR) / (FEE_PROXY_BPS_DIVISOR - bps) + 1n;
				expect(result.totalGrossAssets - least <= extraBound).toBe(true);
			}
		}
	});

	it('a high bps with many legs stays within the search bound', () => {
		const targets = Array.from({ length: 50 }, (_, index) => TRUST + BigInt(index) * 7n);
		const result = feeProxyGrossUpForTargets({ targets, bps: 9_999n, fixedFee: 1n });
		expect(coversTargets(result.grossAssets, targets, 9_999n, 1n)).toBe(true);
		expect(coversTargets(result.grossAssets, targets, 0n, 0n)).toBe(true);
	});

	it('tiny targets against a large fixed fee still give every leg a non-zero gross', () => {
		const result = feeProxyGrossUpForTargets({
			targets: [1n, 1n, 1n, 1n],
			bps: 9_999n,
			fixedFee: TRUST,
		});
		expect(result.grossAssets.every((gross) => gross > 0n)).toBe(true);
		for (const forwarded of result.forwardedAssets) {
			expect(forwarded >= 1n).toBe(true);
		}
	});
});

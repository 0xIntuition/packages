/**
 * DynamicFeeFlatPriceCurve — where a deposit's or a redeem's fee GOES, mirrored exactly.
 *
 * `dynamic-fee-curve.ts` answers what a trade costs; this module answers what that cost pays, tier
 * by tier. It mirrors the contract's `recordDeposit` replay — `_replayDepositBands`,
 * `_applyDepositBand`, `_payDepositFee` and the sliding-fulcrum `_payFulcrumTiers` — field for field
 * and floor for floor, so a projection computed here matches the accumulator deltas the contract
 * writes to the wei. `dynamicFeeDistributeRedeem` does the same for `recordRedeem`: the lot unwind,
 * each lot's exiting-tier slice and the reroute of whatever its cohort could not take, and one
 * fulcrum spread with every residual lot of the exiter excluded.
 *
 * Stake is held as lots, one per holder and tier, each keyed to the band it landed in. A deposit
 * opens or tops up the lot in every band it traverses and never moves an earlier one; a redeem
 * unwinds lots highest tier first and charges each portion at its own lot's rate. That makes the
 * position a `DynamicFeeLots` map rather than a stake plus an average, and it is what the replay
 * takes and returns.
 *
 * Exactness costs inputs. The distribution depends on state the schedule alone does not carry:
 * per-tier occupancy (`tierStake`), the trading account's own lots, and — for the amounts a deposit
 * banks and the debts both legs re-base — the per-tier accumulators. All of it is exposed by
 * `@0xintuition/protocol`; callers who cannot supply the account's lots get the fresh-account
 * behaviour, which is exact for a first-time depositor.
 *
 * Everything here floors where the contract floors (`mulDiv` / `fullMulDiv` semantics) rather than
 * rounding "sensibly": the point is bit-parity with the chain, not a smoother number.
 */

import {
	DYNAMIC_FEE_BPS,
	dynamicFeeDepositFeeBps,
	dynamicFeeRedeemFeeBps,
	dynamicFeeTierOf,
	dynamicFeeTierUpperEdge,
	dynamicFeeTierWidthAt,
} from './dynamic-fee-curve';
import { mulDivDown } from './math';
import type {
	DynamicFeeAccumulators,
	DynamicFeeConfig,
	DynamicFeeLots,
	DynamicFeeTierOverride,
} from './types';

/** `TIER_PRECISION` / `ACC_PRECISION` on chain: tier distances and accumulators are 1e18-scaled. */
export const DYNAMIC_FEE_TIER_PRECISION = 10n ** 18n;
export const DYNAMIC_FEE_ACC_PRECISION = 10n ** 18n;

/**
 * `WEIGHT_PRECISION` on chain: the scale of an effective weight in the fulcrum spread, a kernel
 * weight in `TIER_PRECISION` times a fill ratio carried at `TIER_PRECISION`. The extra headroom is
 * what keeps a tier at the edge of the window, whose kernel weight is a single unit, from rounding
 * its effective weight to nothing.
 */
export const DYNAMIC_FEE_WEIGHT_PRECISION = DYNAMIC_FEE_TIER_PRECISION * DYNAMIC_FEE_TIER_PRECISION;

/**
 * `NO_LOT` on chain: the top-tier sentinel for an account holding no lot, one past the highest tier
 * index a 256-bit lot mask can hold.
 */
export const DYNAMIC_FEE_NO_LOT = 256n;

/** Per-tier cohort stake (`tierStake`), keyed by tier. Absent tiers read as zero. */
export type DynamicFeeTierOccupancy = Map<bigint, bigint>;

/** What one tier's cohort receives from a distribution. */
export type DynamicFeeTierPayout = {
	tier: bigint;
	/** Assets credited to this tier's cohort in total. */
	amount: bigint;
	/**
	 * The exact `accFeePerShare` increment the contract writes for this tier, in `ACC_PRECISION`.
	 * A holder's pending delta is `floor(stake * accAfter / ACC) - floor(stake * accBefore / ACC)`,
	 * which is what makes wei-exact per-account projection possible.
	 */
	accDelta: bigint;
};

/** One band of a replayed deposit, as `DepositBandRecorded` reports it. */
export type DynamicFeeDepositBandLanding = {
	tier: bigint;
	stake: bigint;
	fee: bigint;
};

/** One lot a redeem drew from, as `RedeemLotRecorded` reports it. */
export type DynamicFeeRedeemLotDraw = {
	tier: bigint;
	shares: bigint;
	fee: bigint;
};

export type DynamicFeeDepositDistribution = {
	/** Credited tiers in ascending order. Tiers that received nothing are absent. */
	perTier: DynamicFeeTierPayout[];
	/**
	 * Fee no cohort was there to earn at the schedule rate — protocol accrual. A first-tier deposit
	 * has no prior tier at all; past that it is the part of a pool the prior ladder's occupancy could
	 * not absorb once every tier is paid at the schedule ceiling.
	 */
	toProtocol: bigint;
	/** Occupancy as the contract leaves it: fee-independent, with the deposit's stake landed. */
	occupancyAfter: DynamicFeeTierOccupancy;
	/** The accumulators as the contract leaves them, the supplied values plus this deposit's deltas. */
	accFeePerShareAfter: DynamicFeeAccumulators;
	/** The bands the stake traversed, in ascending order, with each band's slice of the fee. */
	bands: DynamicFeeDepositBandLanding[];
	/** The depositor's lots as the contract leaves them. */
	depositorAfter: DynamicFeeLots;
	/** The depositor's highest lot after the deposit, or `DYNAMIC_FEE_NO_LOT` when they hold none. */
	topTierAfter: bigint;
	/**
	 * What the replay banked into the account-wide settled balance. A deposit settles only the lots
	 * it tops up, so this is non-zero only when a band lands on a lot that had earned something.
	 */
	banked: bigint;
};

export type DynamicFeeRedeemDistribution = {
	/** Credited tiers in ascending order. Tiers that received nothing are absent. */
	perTier: DynamicFeeTierPayout[];
	/**
	 * Fee nobody was there to earn: the exiting-tier slice no neighbouring tier could take, plus the
	 * part of the spread's pool the prior ladder's occupancy could not absorb at the schedule rate.
	 */
	toProtocol: bigint;
	/** Occupancy as the contract leaves it, with the exiting shares removed. */
	occupancyAfter: DynamicFeeTierOccupancy;
	/** The accumulators as the contract leaves them, the supplied values plus this redeem's deltas. */
	accFeePerShareAfter: DynamicFeeAccumulators;
	/** The lots the redeem drew from, highest tier first, with each lot's portion of the fee. */
	lots: DynamicFeeRedeemLotDraw[];
	exiterAfter: {
		/** The residual lots, re-based so they hold no pending against this redeem's own fee. */
		lots: DynamicFeeLots;
		/** Total residual stake, the sum of those lots. */
		stake: bigint;
		/** The highest lot before the unwind — the first lot drawn from — or `DYNAMIC_FEE_NO_LOT`. */
		topTierBefore: bigint;
		/** The highest lot left, or `DYNAMIC_FEE_NO_LOT` after a full exit. */
		topTierAfter: bigint;
		/** What `_settle` banked from the whole position before any of the fee was distributed. */
		settled: bigint;
	};
};

/** Mutable vault-level state both replays mutate: `tierStake`, `accFeePerShare`, `protocolAccrued`. */
type DistributionState = {
	config: DynamicFeeConfig;
	overrides?: Map<bigint, DynamicFeeTierOverride>;
	occupancy: Map<bigint, bigint>;
	acc: DynamicFeeAccumulators;
	payouts: Map<bigint, { amount: bigint; accDelta: bigint }>;
	toProtocol: bigint;
	/**
	 * The trading account's lots, removed from every recipient denominator. The redeem leg passes the
	 * exiter's residual lots; the deposit leg excludes nobody and leaves this undefined.
	 */
	exclude?: DynamicFeeLots;
};

function occupancyAt(state: DistributionState, tier: bigint): bigint {
	return state.occupancy.get(tier) ?? 0n;
}

function accAt(state: DistributionState, tier: bigint): bigint {
	return state.acc.get(tier) ?? 0n;
}

/** The stake at `tier` that may receive a credit: the cohort net of the excluded account's lot. */
function recipientStakeAt(state: DistributionState, tier: bigint): bigint {
	return occupancyAt(state, tier) - (state.exclude?.get(tier)?.stake ?? 0n);
}

/** The lot tiers a position holds, highest first — the order a redeem unwinds them. */
function lotTiersDescending(lots: DynamicFeeLots): bigint[] {
	return [...lots.keys()].sort((a, b) => (a > b ? -1 : 1));
}

/** Mirrors `lotMask.fls()`: the highest occupied lot tier, or the `NO_LOT` sentinel. */
function topTierOf(lots: DynamicFeeLots): bigint {
	let top: bigint | null = null;
	for (const tier of lots.keys()) {
		if (top === null || tier > top) {
			top = tier;
		}
	}
	return top ?? DYNAMIC_FEE_NO_LOT;
}

function credit(state: DistributionState, tier: bigint, amount: bigint, stake: bigint): void {
	const entry = state.payouts.get(tier) ?? { amount: 0n, accDelta: 0n };
	const accDelta = mulDivDown(amount, DYNAMIC_FEE_ACC_PRECISION, stake);
	entry.amount += amount;
	entry.accDelta += accDelta;
	state.payouts.set(tier, entry);
	state.acc.set(tier, accAt(state, tier) + accDelta);
}

/**
 * Mirrors `_isEligibleStake`: strictly positive AND at or above the configured floor, which is a
 * fraction of the tier's own width in bps.
 */
function isEligibleStake(tier: bigint, stake: bigint, config: DynamicFeeConfig): boolean {
	if (stake <= 0n) {
		return false;
	}
	const floorBps = config.minEligibleTierStakeBps;
	if (floorBps === 0n) {
		return true;
	}
	return stake >= mulDivDown(dynamicFeeTierWidthAt(tier, config), floorBps, DYNAMIC_FEE_BPS);
}

/**
 * Mirrors `_creditEligibleCapped`: credit `amount` to `tier`'s cohort of `stake`, capped at the schedule
 * rate per share — a cohort holding less than the band's width keeps `amount * stake / width`.
 * Returns the unpaid remainder, which the caller walks on to its next candidate tier; what a whole
 * walk cannot place accrues rather than entering the fulcrum pool, which would offer it to tiers
 * that already took their fill. Used only by the single-target credits (the deposit spike, an
 * exiting-tier slice, a reroute, a lot cohort): a lump with one recipient has no other tier to
 * normalize against, so the fill is the only bound on it. The spread needs no cap, since occupancy
 * is already inside its weights.
 */
function creditCapped(
	state: DistributionState,
	tier: bigint,
	amount: bigint,
	stake: bigint
): bigint {
	const width = dynamicFeeTierWidthAt(tier, state.config);
	const paid = stake >= width ? amount : mulDivDown(amount, stake, width);
	if (paid > 0n) {
		credit(state, tier, paid, stake);
	}
	return amount - paid;
}

/** Mirrors `_triangularWeight`: a tent peaking at the fulcrum, hard zero at `sigma`. */
function triangularWeight(dist: bigint, sigma: bigint): bigint {
	const ratio = mulDivDown(dist, DYNAMIC_FEE_TIER_PRECISION, sigma);
	return ratio < DYNAMIC_FEE_TIER_PRECISION ? DYNAMIC_FEE_TIER_PRECISION - ratio : 0n;
}

/** Mirrors `_fulcrumDistance`: |d - dStar| in `TIER_PRECISION` units. */
function fulcrumDistance(d: bigint, dStar: bigint): bigint {
	const dP = d * DYNAMIC_FEE_TIER_PRECISION;
	return dP > dStar ? dP - dStar : dStar - dP;
}

/**
 * Mirrors `_weighPriorTiers`: fill `stakes` — each prior tier's stake net of the excluded account's
 * lot, zeroed when the tier is ineligible — and `weights` with the effective weight
 * `e_t = w_t * stake_t / width_t` in `WEIGHT_PRECISION`, both indexed by `d - 1`. Returns the summed
 * effective weight and the plain kernel sum over EVERY prior tier regardless of occupancy, in the
 * same units: the normalizer a ladder holding exactly its widths would have.
 *
 * The fill-only fallback keys on the WINDOW, not on the effective sum. A tier at the edge of the
 * window carries a kernel weight of a single `TIER_PRECISION` unit, which at the old scale drove its
 * effective weight to zero and wrongly activated the fill-only split; carrying weights at
 * `WEIGHT_PRECISION` keeps such a tier non-zero down to a fill of one part in 1e18, and the
 * `inWindow` flag keeps a window that holds an eligible tier from falling back at all.
 */
function weighPriorTiers(
	state: DistributionState,
	span: bigint,
	dStar: bigint,
	sigma: bigint,
	weights: bigint[],
	stakes: bigint[]
): { sumWeights: bigint; sumRef: bigint } {
	let sumWeights = 0n;
	let sumRef = 0n;
	let inWindow = false;
	for (let d = 1n; d <= span; d++) {
		const recipientTier = span - d;
		const weight = triangularWeight(fulcrumDistance(d, dStar), sigma) * DYNAMIC_FEE_TIER_PRECISION;
		sumRef += weight;
		let recipientStake = recipientStakeAt(state, recipientTier);
		if (!isEligibleStake(recipientTier, recipientStake, state.config)) {
			recipientStake = 0n;
		}
		stakes.push(recipientStake);
		let effective = 0n;
		if (recipientStake > 0n && weight > 0n) {
			inWindow = true;
			effective = mulDivDown(
				weight,
				recipientStake,
				dynamicFeeTierWidthAt(recipientTier, state.config)
			);
			sumWeights += effective;
		}
		weights.push(effective);
	}
	if (!inWindow) {
		sumWeights = weighByFill(state, span, weights, stakes);
		sumRef = span * DYNAMIC_FEE_WEIGHT_PRECISION;
	}
	return { sumWeights, sumRef };
}

/**
 * Mirrors `_weighByFill`: the fallback for a window that admits no eligible tier — the same rule
 * with every kernel weight set to one, so each eligible prior tier's weight becomes its fill ratio
 * `stake_t / width_t` in `WEIGHT_PRECISION` and the pool splits by fill alone across the whole prior
 * ladder. Reuses the stakes the first pass computed, so eligibility is not re-tested.
 */
function weighByFill(
	state: DistributionState,
	span: bigint,
	weights: bigint[],
	stakes: bigint[]
): bigint {
	let sumWeights = 0n;
	for (let d = 1n; d <= span; d++) {
		const index = Number(d - 1n);
		const recipientStake = stakes[index] as bigint;
		if (recipientStake > 0n) {
			const effective = mulDivDown(
				DYNAMIC_FEE_WEIGHT_PRECISION,
				recipientStake,
				dynamicFeeTierWidthAt(span - d, state.config)
			);
			weights[index] = effective;
			sumWeights += effective;
		}
	}
	return sumWeights;
}

/**
 * Mirrors `_creditByWeight`: each tier with a non-zero effective weight takes `pool * e_t / D`,
 * booked to its accumulator per unit of stake. `exact` says `D` is the effective sum itself, so the
 * pool is meant to be spread whole and the integer-division dust goes to the last tier credited.
 * Otherwise `D` is the schedule's normalizer, each credit is that tier's schedule-rate share, and
 * the shortfall is a genuine remainder the caller books. Returns what was placed.
 */
function creditByWeight(
	state: DistributionState,
	pool: bigint,
	span: bigint,
	denominator: bigint,
	exact: boolean,
	weights: bigint[],
	stakes: bigint[]
): bigint {
	let paid = 0n;
	let lastTier = 0n;
	let lastStake = 0n;
	for (let d = 1n; d <= span; d++) {
		const index = Number(d - 1n);
		const effective = weights[index] as bigint;
		if (effective > 0n) {
			const slice = mulDivDown(pool, effective, denominator);
			if (slice > 0n) {
				credit(state, span - d, slice, stakes[index] as bigint);
				paid += slice;
			}
			// Remembered whether or not the slice floored to zero: the remainder below is owed to the
			// last tier the weights reached, not to the last one a non-zero slice happened to land on.
			lastTier = span - d;
			lastStake = stakes[index] as bigint;
		}
	}
	if (exact && paid < pool) {
		credit(state, lastTier, pool - paid, lastStake);
		paid = pool;
	}
	return paid;
}

/**
 * Mirrors `_payFulcrumTiers`: spread `pool` across the prior tiers `[0, sourceTier)` by the
 * triangular kernel centred `(1 - alpha) * span` tiers below the source, weighted by occupancy, with
 * the excluded account's residual lots removed from every stake read.
 *
 * Each eligible prior tier carries `e_t = max(0, 1 - |d - dStar| / sigma) * stake_t / width_t` and
 * takes `pool * e_t / D`, so its per-share income is `pool * w_t / (width_t * D)` — the kernel weight
 * per unit of width times one rate common to every tier in the spread. `D` is `max(Σe, Σw)`, where
 * `Σw` runs over every prior tier regardless of occupancy. When the prior ladder holds at least its
 * widths the pool is spread whole; when it holds less, every tier is paid the schedule rate for the
 * stake it has and the part no stake is there to earn is returned unpaid. The spread books nothing
 * to the protocol itself: the two legs differ on where an unpaid remainder belongs, so the caller
 * decides. A window that admits no eligible tier falls back to fill alone across the whole prior
 * ladder.
 */
function payFulcrumTiers(
	state: DistributionState,
	pool: bigint,
	sourceTier: bigint,
	alphaBps: bigint,
	sigma: bigint
): bigint {
	if (pool === 0n) {
		return 0n;
	}
	// No prior tiers (the vault sits in tier 0): nothing below to reward.
	const span = sourceTier;
	if (span === 0n) {
		return pool;
	}

	const dStar = mulDivDown(
		(DYNAMIC_FEE_BPS - alphaBps) * span,
		DYNAMIC_FEE_TIER_PRECISION,
		DYNAMIC_FEE_BPS
	);
	// Indexed by d - 1: d = 1 is the nearest prior tier, d = span is tier 0. The fill-only fallback,
	// when the window admits no eligible tier, is applied inside the weighting pass.
	const weights: bigint[] = [];
	const stakes: bigint[] = [];
	const { sumWeights, sumRef } = weighPriorTiers(state, span, dStar, sigma, weights, stakes);

	const exact = sumWeights >= sumRef;
	const paid =
		sumWeights === 0n
			? 0n
			: creditByWeight(state, pool, span, exact ? sumWeights : sumRef, exact, weights, stakes);
	return pool - paid;
}

/**
 * Mirrors `_creditDownward`: credit `amount` down the prior tiers of `fromTier`, nearest first, each
 * eligible tier taking up to its fill of its band. No stake is excluded — this is the deposit leg.
 * Returns what no prior tier could take.
 */
function creditDownward(state: DistributionState, amount: bigint, fromTier: bigint): bigint {
	let unpaid = amount;
	for (let k = fromTier; k > 0n && unpaid > 0n; ) {
		k -= 1n;
		const recipientStake = occupancyAt(state, k);
		if (isEligibleStake(k, recipientStake, state.config)) {
			unpaid = creditCapped(state, k, unpaid, recipientStake);
		}
	}
	return unpaid;
}

/**
 * Mirrors `_payDepositFee`: the `depositToPriorTierBps` spike walks down the prior tiers, nearest
 * first, each taking up to its fill, and the rest spreads by the occupancy-weighted kernel. What no
 * prior tier can take at that rate accrues rather than joining the fulcrum pool — offered to the
 * spread it would reach the same tiers a second time, above the schedule rate. The spread therefore
 * runs on `fee - spike` alone, and what it cannot place has no other home on this leg either.
 */
function payDepositFee(state: DistributionState, feeAmount: bigint, sourceTier: bigint): void {
	if (feeAmount === 0n) {
		return;
	}
	const { config } = state;
	const toPriorTier = mulDivDown(feeAmount, config.depositToPriorTierBps, DYNAMIC_FEE_BPS);

	let unpaid = 0n;
	if (toPriorTier > 0n) {
		unpaid = creditDownward(state, toPriorTier, sourceTier);
	}

	unpaid += payFulcrumTiers(
		state,
		feeAmount - toPriorTier,
		sourceTier,
		config.depositFulcrumAlphaBps,
		config.depositKernelSpread
	);
	state.toProtocol += unpaid;
}

/** Mirrors `_settleLot`: what a lot has earned since its last checkpoint, and its new debt. */
function settleLot(state: DistributionState, lots: DynamicFeeLots, tier: bigint): bigint {
	const lot = lots.get(tier);
	if (!lot) {
		return 0n;
	}
	const accumulated = mulDivDown(lot.stake, accAt(state, tier), DYNAMIC_FEE_ACC_PRECISION);
	const earned = accumulated > lot.rewardDebt ? accumulated - lot.rewardDebt : 0n;
	lot.rewardDebt = accumulated;
	return earned;
}

/**
 * Mirrors `_applyDepositBand`: distribute this band's fee sourced at `bandTier` — reaching only the
 * tiers below it — then land the band's stake in the lot at that tier, banking what that lot had
 * earned before its debt is re-based. Lots at other tiers are untouched.
 */
function applyDepositBand(
	state: DistributionState,
	lots: DynamicFeeLots,
	bandTier: bigint,
	bandStake: bigint,
	bandFee: bigint
): bigint {
	payDepositFee(state, bandFee, bandTier);
	if (bandStake === 0n) {
		return 0n;
	}

	const banked = settleLot(state, lots, bandTier);
	const newStake = (lots.get(bandTier)?.stake ?? 0n) + bandStake;
	lots.set(bandTier, {
		stake: newStake,
		rewardDebt: mulDivDown(newStake, accAt(state, bandTier), DYNAMIC_FEE_ACC_PRECISION),
	});
	state.occupancy.set(bandTier, occupancyAt(state, bandTier) + bandStake);
	return banked;
}

/**
 * Where a deposit's fee goes: the exact per-tier payouts and accumulator deltas the contract's
 * `recordDeposit` writes, computed off chain.
 *
 * `netStake` is the SHARES the deposit mints (the amount `recordDeposit` receives) — not the gross
 * assets in — and `feeAmount` is the single curve fee quoted for the whole deposit; the replay
 * apportions it across the traversed bands exactly as `_replayDepositBands` does, including the
 * remainder landing on the last band. The depositor's own lots sit in the denominators like anyone
 * else's, and their landed bands change occupancy for the bands that follow — that is the mechanism,
 * not an approximation.
 *
 * From the result, a holder's projected earning is their pro-rata share of their tiers' payouts:
 * exactly `floor(stake * (accBefore + accDelta) / 1e18) - floor(stake * accBefore / 1e18)` per lot.
 */
export function dynamicFeeDistributeDeposit(inputs: {
	startAssets: bigint;
	netStake: bigint;
	feeAmount: bigint;
	config: DynamicFeeConfig;
	occupancy: DynamicFeeTierOccupancy;
	overrides?: Map<bigint, DynamicFeeTierOverride>;
	/** `accFeePerShare` before the deposit. Omit when no tier has been credited yet. */
	accFeePerShare?: DynamicFeeAccumulators;
	/** The depositor's lots, when they already hold some. Omit for a fresh account. */
	depositor?: DynamicFeeLots;
}): DynamicFeeDepositDistribution {
	const { startAssets, netStake, feeAmount, config, overrides } = inputs;

	const state: DistributionState = {
		config,
		overrides,
		occupancy: new Map(inputs.occupancy),
		acc: new Map(inputs.accFeePerShare),
		payouts: new Map(),
		toProtocol: 0n,
	};
	const lots: DynamicFeeLots = new Map();
	for (const [tier, lot] of inputs.depositor ?? []) {
		if (lot.stake > 0n) {
			lots.set(tier, { ...lot });
		}
	}

	const sourceTier = dynamicFeeTierOf(startAssets, config);
	const topTier = config.tierCount - 1n;
	const bands: DynamicFeeDepositBandLanding[] = [];
	let banked = 0n;

	if (netStake === 0n) {
		// The hook runs on every deposit into a hook curve, including ones that mint nothing. There is
		// no band to walk, so the fee is distributed once from the vault's current tier.
		payDepositFee(state, feeAmount, sourceTier);
	} else if (
		// Single-band fast path, mirrored so the two implementations cannot diverge on which route runs.
		sourceTier === topTier ||
		startAssets + netStake <= dynamicFeeTierUpperEdge(sourceTier, config)
	) {
		bands.push({ tier: sourceTier, stake: netStake, fee: feeAmount });
		banked += applyDepositBand(state, lots, sourceTier, netStake, feeAmount);
	} else {
		// `_walkDepositBands`: net chunks against the edges, weighted by each band's own rate.
		const bandStakes: bigint[] = [];
		const bandTiers: bigint[] = [];
		let totalWeight = 0n;
		let remaining = netStake;
		let cursor = startAssets;
		let bandTier = sourceTier;
		while (remaining > 0n) {
			let chunk = remaining;
			if (bandTier < topTier) {
				const room = dynamicFeeTierUpperEdge(bandTier, config) - cursor;
				if (room < chunk) {
					chunk = room;
				}
			}
			bandStakes.push(chunk);
			bandTiers.push(bandTier);
			totalWeight += mulDivDown(
				chunk,
				dynamicFeeDepositFeeBps(bandTier, config, overrides?.get(bandTier)),
				DYNAMIC_FEE_BPS
			);
			remaining -= chunk;
			cursor += chunk;
			bandTier += 1n;
		}

		let assigned = 0n;
		for (let i = 0; i < bandStakes.length; i++) {
			const tier = bandTiers[i] as bigint;
			const stake = bandStakes[i] as bigint;
			let bandFee = 0n;
			if (i + 1 === bandStakes.length) {
				bandFee = feeAmount - assigned;
			} else if (totalWeight > 0n) {
				bandFee = mulDivDown(
					feeAmount,
					mulDivDown(
						stake,
						dynamicFeeDepositFeeBps(tier, config, overrides?.get(tier)),
						DYNAMIC_FEE_BPS
					),
					totalWeight
				);
				assigned += bandFee;
			}
			bands.push({ tier, stake, fee: bandFee });
			banked += applyDepositBand(state, lots, tier, stake, bandFee);
		}
	}

	return {
		perTier: sortedPayouts(state),
		toProtocol: state.toProtocol,
		occupancyAfter: state.occupancy,
		accFeePerShareAfter: state.acc,
		bands,
		depositorAfter: lots,
		topTierAfter: topTierOf(lots),
		banked,
	};
}

function sortedPayouts(state: DistributionState): DynamicFeeTierPayout[] {
	return [...state.payouts.entries()]
		.map(([tier, payout]) => ({ tier, ...payout }))
		.sort((a, b) => (a.tier < b.tier ? -1 : 1));
}

/**
 * Mirrors `_unwindLots`: take `shares` from the lots, highest tier first, reducing each lot and its
 * tier's occupancy before anything is distributed, and report what was drawn from each in draw
 * order. A drained lot is removed, which is how the top lot drops back down.
 */
function unwindLots(
	state: DistributionState,
	lots: DynamicFeeLots,
	shares: bigint
): DynamicFeeRedeemLotDraw[] {
	// `userStake -= shares` is the contract's first write, so a redeem larger than the position
	// reverts there before any lot moves. Checking the sum up front is the same gate.
	let positionStake = 0n;
	for (const lot of lots.values()) {
		positionStake += lot.stake;
	}
	if (shares > positionStake) {
		throw new Error('Shares exceed the recorded stake.');
	}

	const draws: DynamicFeeRedeemLotDraw[] = [];
	let remaining = shares;
	for (const tier of lotTiersDescending(lots)) {
		if (remaining === 0n) {
			break;
		}
		const lot = lots.get(tier) as { stake: bigint; rewardDebt: bigint };
		const take = lot.stake < remaining ? lot.stake : remaining;

		draws.push({ tier, shares: take, fee: 0n });
		lot.stake -= take;
		if (lot.stake === 0n) {
			lots.delete(tier);
		}
		state.occupancy.set(tier, occupancyAt(state, tier) - take);
		remaining -= take;
	}
	return draws;
}

/**
 * Mirrors `_creditRerouted`: credit `amount` to tier `k` if it holds eligible stake net of the
 * exiter, capped at its fill. Returns the unpaid part.
 */
function creditRerouted(state: DistributionState, k: bigint, amount: bigint): bigint {
	const recipientStake = recipientStakeAt(state, k);
	if (!isEligibleStake(k, recipientStake, state.config)) {
		return amount;
	}
	return creditCapped(state, k, amount, recipientStake);
}

/**
 * Mirrors `_rerouteExitSlice`: the part of an exiting-tier slice its own cohort could not take walks
 * the eligible tiers above `tier`, nearest first, then the eligible tiers below, nearest first, each
 * taking up to its fill net of the exiter. Returns what no tier could take.
 */
function rerouteExitSlice(state: DistributionState, tier: bigint, amount: bigint): bigint {
	let unpaid = amount;
	const { tierCount } = state.config;
	for (let k = tier + 1n; k < tierCount && unpaid > 0n; k++) {
		unpaid = creditRerouted(state, k, unpaid);
	}
	for (let k = tier; k > 0n && unpaid > 0n; ) {
		k -= 1n;
		unpaid = creditRerouted(state, k, unpaid);
	}
	return unpaid;
}

/**
 * Mirrors `_payExitingTierSlice`: pay one lot's exiting-tier slice to the other holders of that
 * tier, the exiter's residual lot there excluded, capped at the cohort's fill of the band. What the
 * cohort cannot take — because it is thin, under the floor, or absent — reroutes through the
 * neighbouring tiers; what no tier can take is returned for the caller to accrue. It never enters
 * the fulcrum pool: every tier has already taken its fill of it, so the spread would pay the same
 * tiers a second time, above the schedule rate.
 */
function payExitingTierSlice(state: DistributionState, tier: bigint, slice: bigint): bigint {
	if (slice === 0n) {
		return 0n;
	}
	const cohortStake = recipientStakeAt(state, tier);
	let undistributed = isEligibleStake(tier, cohortStake, state.config)
		? creditCapped(state, tier, slice, cohortStake)
		: slice;
	if (undistributed > 0n) {
		undistributed = rerouteExitSlice(state, tier, undistributed);
	}
	return undistributed;
}

/**
 * Mirrors `_creditLotCohorts`: when the fulcrum spread could place nothing at all, the pool goes to
 * the cohorts of the tiers this redeem drew from, in draw order (highest first), each up to its fill
 * net of the exiter. Returns what no cohort could take.
 */
function creditLotCohorts(state: DistributionState, lotTiers: bigint[], amount: bigint): bigint {
	let unpaid = amount;
	for (const tier of lotTiers) {
		if (unpaid === 0n) {
			break;
		}
		const cohortStake = recipientStakeAt(state, tier);
		if (isEligibleStake(tier, cohortStake, state.config)) {
			unpaid = creditCapped(state, tier, unpaid, cohortStake);
		}
	}
	return unpaid;
}

/**
 * Mirrors `_distributeLotFees`: apportion the collected fee across the lots the redeem drew from, by
 * their notional fee `shares * rate / BPS`, the last lot taking the remainder so the split sums to
 * `feeAmount` exactly. Each lot's portion splits into an exiting-tier slice and a fulcrum slice.
 * Returns `fulcrum`, the sum of the lots' reserved slices, which is what the single spread runs on,
 * and separately `leftover`, the sum of whatever their exiting-tier slices could not place anywhere,
 * which accrues rather than reaching either route.
 */
function distributeLotFees(
	state: DistributionState,
	feeAmount: bigint,
	draws: DynamicFeeRedeemLotDraw[]
): { fulcrum: bigint; leftover: bigint } {
	const { config, overrides } = state;
	const rateOf = (tier: bigint) => dynamicFeeRedeemFeeBps(tier, config, overrides?.get(tier));

	let totalWeight = 0n;
	for (const draw of draws) {
		totalWeight += mulDivDown(draw.shares, rateOf(draw.tier), DYNAMIC_FEE_BPS);
	}

	let assigned = 0n;
	let fulcrum = 0n;
	let leftover = 0n;
	for (let i = 0; i < draws.length; i++) {
		const draw = draws[i] as DynamicFeeRedeemLotDraw;
		let lotFee = 0n;
		if (i + 1 === draws.length) {
			lotFee = feeAmount - assigned;
		} else if (totalWeight > 0n) {
			lotFee = mulDivDown(
				feeAmount,
				mulDivDown(draw.shares, rateOf(draw.tier), DYNAMIC_FEE_BPS),
				totalWeight
			);
		}
		assigned += lotFee;
		draw.fee = lotFee;

		const toFulcrum = mulDivDown(lotFee, config.redeemToFulcrumTiersBps, DYNAMIC_FEE_BPS);
		fulcrum += toFulcrum;
		leftover += payExitingTierSlice(state, draw.tier, lotFee - toFulcrum);
	}
	// The trailing term is non-zero only for a redeem that drew no lot at all; with any draw the
	// last lot took the remainder and the split is already exact.
	return { fulcrum: fulcrum + (feeAmount - assigned), leftover };
}

/**
 * Where a redeem's fee goes: the exact per-tier payouts and accumulator deltas the contract's
 * `recordRedeem` writes, computed off chain.
 *
 * `startAssets` is `vaultStake` before the exit and `shares` the amount redeemed, both in flat 1:1
 * stake units. The lots unwind highest tier first, each portion priced at its own lot's rate, and
 * the exiting shares leave `tierStake` before anything is paid — so each lot's exiting-tier slice
 * divides over the other holders of that tier alone, capped at that cohort's fill of its band. What
 * that cohort cannot take walks the eligible tiers above it, nearest first, then below, each up to
 * its own fill; what no tier can take accrues, because every tier the walk reached has already had
 * its fill of it. The fulcrum share spreads separately, and if that spread places nothing — the
 * vault sits in tier 0, or every prior tier is empty — it goes to the cohorts of the tiers this
 * redeem drew from. The exiter is excluded everywhere: their residual lots sit outside every
 * denominator and are re-based afterwards, so they earn nothing from the fee they paid, at any tier.
 */
export function dynamicFeeDistributeRedeem(inputs: {
	startAssets: bigint;
	shares: bigint;
	feeAmount: bigint;
	config: DynamicFeeConfig;
	occupancy: DynamicFeeTierOccupancy;
	overrides?: Map<bigint, DynamicFeeTierOverride>;
	/** `accFeePerShare` before the redeem. Omit when no tier has been credited yet. */
	accFeePerShare?: DynamicFeeAccumulators;
	/** The exiter's lots before the redeem. */
	exiter: DynamicFeeLots;
}): DynamicFeeRedeemDistribution {
	const { startAssets, shares, feeAmount, config, overrides } = inputs;

	const lots: DynamicFeeLots = new Map();
	for (const [tier, lot] of inputs.exiter) {
		if (lot.stake > 0n) {
			lots.set(tier, { ...lot });
		}
	}
	const state: DistributionState = {
		config,
		overrides,
		occupancy: new Map(inputs.occupancy),
		acc: new Map(inputs.accFeePerShare),
		payouts: new Map(),
		toProtocol: 0n,
		exclude: lots,
	};

	const currentTier = dynamicFeeTierOf(startAssets, config);
	const topTierBefore = topTierOf(lots);

	// `_settle`: bank everything the whole position has earned, before the exiting stake leaves any
	// denominator and before this redeem's own fee is credited anywhere.
	let settled = 0n;
	for (const tier of lotTiersDescending(lots)) {
		settled += settleLot(state, lots, tier);
	}

	const draws = unwindLots(state, lots, shares);
	const { fulcrum, leftover } = distributeLotFees(state, feeAmount, draws);
	// One spread for the whole redeem, from the vault's tier, on the fulcrum slices alone. If it
	// could place nothing at all, those slices go to the cohorts of the tiers this redeem drew from
	// instead. The leftover never enters either route: every tier the exiting-tier walk reached has
	// already taken its fill of it, so re-offering it would pay them above the schedule rate.
	let unpaid = payFulcrumTiers(
		state,
		fulcrum,
		currentTier,
		config.redeemFulcrumAlphaBps,
		config.redeemKernelSpread
	);
	if (unpaid === fulcrum && fulcrum > 0n) {
		unpaid = creditLotCohorts(
			state,
			draws.map((draw) => draw.tier),
			fulcrum
		);
	}
	state.toProtocol += unpaid + leftover;

	// `_rebaseLots`: every residual lot re-checkpointed against the post-distribution accumulators.
	let residualStake = 0n;
	for (const [tier, lot] of lots) {
		lot.rewardDebt = mulDivDown(lot.stake, accAt(state, tier), DYNAMIC_FEE_ACC_PRECISION);
		residualStake += lot.stake;
	}

	return {
		perTier: sortedPayouts(state),
		toProtocol: state.toProtocol,
		occupancyAfter: state.occupancy,
		accFeePerShareAfter: state.acc,
		lots: draws,
		exiterAfter: {
			lots,
			stake: residualStake,
			topTierBefore,
			topTierAfter: topTierOf(lots),
			settled,
		},
	};
}

/**
 * A holder's wei-exact earning from a distribution: the pending delta the contract's accumulator
 * arithmetic produces, given the holder's lots and the accumulators BEFORE the trade. The two floors
 * do not commute with subtraction, which is why the "before" values are a required input rather than
 * assumed zero, and the sum runs per lot because each lot is checkpointed at its own tier.
 */
export function dynamicFeeProjectHolderEarning(inputs: {
	distribution: Pick<DynamicFeeDepositDistribution | DynamicFeeRedeemDistribution, 'perTier'>;
	/** The holder's lots, keyed by tier. */
	lots: DynamicFeeLots;
	/** `accFeePerShare` before the trade, keyed by tier. Absent tiers read as zero. */
	accBefore: DynamicFeeAccumulators;
}): bigint {
	const { distribution, lots, accBefore } = inputs;
	let earning = 0n;
	for (const [tier, lot] of lots) {
		const payout = distribution.perTier.find((entry) => entry.tier === tier);
		if (!payout || lot.stake === 0n) {
			continue;
		}
		const before = accBefore.get(tier) ?? 0n;
		earning +=
			mulDivDown(lot.stake, before + payout.accDelta, DYNAMIC_FEE_ACC_PRECISION) -
			mulDivDown(lot.stake, before, DYNAMIC_FEE_ACC_PRECISION);
	}
	return earning;
}

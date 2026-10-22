import { describe, expect, it } from 'vitest';
import { dynamicFeeQuoteRedeemFeeForLots, dynamicFeeTierOf } from '../dynamic-fee-curve';
import type { DynamicFeeTierOccupancy } from '../dynamic-fee-distribution';
import {
	DYNAMIC_FEE_ACC_PRECISION,
	DYNAMIC_FEE_NO_LOT,
	dynamicFeeDistributeDeposit,
	dynamicFeeDistributeRedeem,
} from '../dynamic-fee-distribution';
import { mulDivDown, WAD } from '../math';
import type { DynamicFeeAccumulators, DynamicFeeConfig, DynamicFeeLots } from '../types';

/**
 * The Solidity suite's `_defaultConfig`: width0 10 TRUST, 5 tiers compounding at 1.2x (edges 10,
 * 22, 36.4, 53.68, 74.416), nearest-first kernel on both legs, sigma 4 tiers, no floor.
 */
const config: DynamicFeeConfig = {
	width0: 10n * WAD,
	tierCount: 5n,
	tierWidthGrowthBps: 2_000n,
	depositBaseBps: 100n,
	depositGrowthBps: 50n,
	depositCapBps: 1_000n,
	depositFulcrumAlphaBps: 10_000n,
	depositKernelSpread: 4n * WAD,
	redeemFulcrumAlphaBps: 10_000n,
	redeemKernelSpread: 4n * WAD,
	redeemBaseBps: 200n,
	redeemGrowthBps: 50n,
	redeemCapBps: 1_000n,
	redeemToFulcrumTiersBps: 0n,
	depositToPriorTierBps: 0n,
	minEligibleTierStakeBps: 0n,
};

const ACC = DYNAMIC_FEE_ACC_PRECISION;

/** Enough of the contract's storage to chain the two replays: occupancy, accumulators, lots. */
type Ledger = {
	config: DynamicFeeConfig;
	vaultStake: bigint;
	occupancy: DynamicFeeTierOccupancy;
	acc: DynamicFeeAccumulators;
	protocolAccrued: bigint;
	lots: Map<string, DynamicFeeLots>;
	settled: Map<string, bigint>;
};

function ledger(overrides: Partial<DynamicFeeConfig> = {}): Ledger {
	return {
		config: { ...config, ...overrides },
		vaultStake: 0n,
		occupancy: new Map(),
		acc: new Map(),
		protocolAccrued: 0n,
		lots: new Map(),
		settled: new Map(),
	};
}

function lotsOf(l: Ledger, name: string): DynamicFeeLots {
	return l.lots.get(name) ?? new Map();
}

/** `_pendingFor`: the unsettled amount across every lot of a position. */
function pending(l: Ledger, name: string): bigint {
	let total = 0n;
	for (const [tier, lot] of lotsOf(l, name)) {
		const accumulated = mulDivDown(lot.stake, l.acc.get(tier) ?? 0n, ACC);
		if (accumulated > lot.rewardDebt) {
			total += accumulated - lot.rewardDebt;
		}
	}
	return total;
}

function claimable(l: Ledger, name: string): bigint {
	return (l.settled.get(name) ?? 0n) + pending(l, name);
}

function bank(l: Ledger, name: string, amount: bigint) {
	l.settled.set(name, (l.settled.get(name) ?? 0n) + amount);
}

function deposit(l: Ledger, name: string, shares: bigint, fee: bigint) {
	const result = dynamicFeeDistributeDeposit({
		startAssets: l.vaultStake,
		netStake: shares,
		feeAmount: fee,
		config: l.config,
		occupancy: l.occupancy,
		accFeePerShare: l.acc,
		depositor: l.lots.get(name),
	});
	l.acc = result.accFeePerShareAfter;
	l.protocolAccrued += result.toProtocol;
	bank(l, name, result.banked);
	l.lots.set(name, result.depositorAfter);
	l.occupancy = result.occupancyAfter;
	l.vaultStake += shares;
	return result;
}

function redeem(l: Ledger, name: string, shares: bigint, fee: bigint) {
	const result = dynamicFeeDistributeRedeem({
		startAssets: l.vaultStake,
		shares,
		feeAmount: fee,
		config: l.config,
		occupancy: l.occupancy,
		accFeePerShare: l.acc,
		exiter: lotsOf(l, name),
	});
	l.acc = result.accFeePerShareAfter;
	l.protocolAccrued += result.toProtocol;
	bank(l, name, result.exiterAfter.settled);
	l.lots.set(name, result.exiterAfter.lots);
	l.occupancy = result.occupancyAfter;
	l.vaultStake -= shares;
	return result;
}

/** What the contract's `quoteRedeemFee` would charge this holder for `shares`. */
function quote(l: Ledger, name: string, shares: bigint): bigint {
	return dynamicFeeQuoteRedeemFeeForLots(
		shares,
		lotsOf(l, name),
		dynamicFeeTierOf(l.vaultStake, l.config),
		l.config
	);
}

function stakeAt(l: Ledger, name: string, tier: bigint): bigint {
	return lotsOf(l, name).get(tier)?.stake ?? 0n;
}

function topTier(l: Ledger, name: string): bigint {
	let top: bigint | null = null;
	for (const tier of lotsOf(l, name).keys()) {
		if (top === null || tier > top) {
			top = tier;
		}
	}
	return top ?? DYNAMIC_FEE_NO_LOT;
}

function expectApprox(actual: bigint, expected: bigint, tolerance: bigint) {
	const diff = actual > expected ? actual - expected : expected - actual;
	expect(diff <= tolerance, `${actual} vs ${expected} (tolerance ${tolerance})`).toBe(true);
}

describe('dynamicFeeDistributeRedeem', () => {
	it('pays a redeem fee through the redeem kernel pair (test_fulcrum_redeemLegUsesRedeemKernel)', () => {
		const l = ledger({
			depositFulcrumAlphaBps: 10_000n,
			redeemFulcrumAlphaBps: 0n,
			redeemToFulcrumTiersBps: 10_000n,
		});
		deposit(l, 'alice', 10n * WAD, 0n);
		deposit(l, 'bob', 12n * WAD, 0n);
		deposit(l, 'carol', (144n * WAD) / 10n, 0n);
		deposit(l, 'dave', (1_728n * WAD) / 100n, 0n);
		deposit(l, 'eve', (20_736n * WAD) / 1_000n, 6n * WAD);

		expectApprox(claimable(l, 'dave'), 3n * WAD, 10_000n);
		expect(claimable(l, 'alice')).toBe(0n);

		const result = redeem(l, 'eve', (20_736n * WAD) / 1_000n, 10n * WAD);

		expectApprox(claimable(l, 'alice'), 4n * WAD, 10_000n);
		expectApprox(claimable(l, 'dave'), 4n * WAD, 10_000n);
		expect(claimable(l, 'eve')).toBe(0n);
		expect(result.perTier.map((entry) => [entry.tier, entry.amount])).toEqual([
			[0n, 4n * WAD],
			[1n, 3n * WAD],
			[2n, 2n * WAD],
			[3n, 1n * WAD],
		]);
		expect(result.toProtocol).toBe(0n);
		expect(result.exiterAfter.stake).toBe(0n);
		expect(result.exiterAfter.topTierBefore).toBe(4n);
		expect(result.exiterAfter.topTierAfter).toBe(DYNAMIC_FEE_NO_LOT);
	});

	it('credits the exiting tier to its residual holders and excludes the exiter (full exit)', () => {
		// test_recordRedeem_diamondSliceToResidualHolders_exiterExcluded
		const l = ledger();
		deposit(l, 'carol', 15n * WAD, 0n); // 10 at tier 0, 5 at tier 1
		deposit(l, 'alice', 3n * WAD, 0n); // tier 1
		deposit(l, 'bob', 3n * WAD, 0n); // tier 1

		const result = redeem(l, 'alice', 3n * WAD, (3n * WAD) / 10n);

		// The tier-1 cohort left after the exit is bob's 3 plus carol's 5: 8 of the 12 TRUST band, so
		// it keeps two thirds of the slice and the unpaid 0.1 reroutes to carol's full tier 0.
		expect(result.perTier).toEqual([
			{ tier: 0n, amount: WAD / 10n, accDelta: WAD / 100n },
			{ tier: 1n, amount: WAD / 5n, accDelta: (25n * WAD) / 1_000n },
		]);
		expect(claimable(l, 'bob')).toBe((75n * WAD) / 1_000n);
		expect(claimable(l, 'alice')).toBe(0n);
		expect(claimable(l, 'carol')).toBe((225n * WAD) / 1_000n);
		expect(result.exiterAfter.stake).toBe(0n);
	});

	it('excludes a partial exiter from their own fee and re-bases their debt to zero pending', () => {
		const l = ledger();
		deposit(l, 'carol', 15n * WAD, 0n);
		deposit(l, 'alice', 3n * WAD, 0n);
		deposit(l, 'bob', 3n * WAD, 0n);

		const result = redeem(l, 'alice', 1n * WAD, (3n * WAD) / 10n);

		// cohort = tierStake[1] after the exit (10) minus alice's residual lot (2) = 8, unchanged from
		// the full-exit case: the redemption size cancels out of the denominator.
		expect(result.perTier).toEqual([
			{ tier: 0n, amount: WAD / 10n, accDelta: WAD / 100n },
			{ tier: 1n, amount: WAD / 5n, accDelta: (25n * WAD) / 1_000n },
		]);
		expect(result.occupancyAfter.get(1n)).toBe(10n * WAD);
		expect(result.exiterAfter.stake).toBe(2n * WAD);
		expect(result.exiterAfter.topTierAfter).toBe(1n);
		expect(result.exiterAfter.lots.get(1n)).toEqual({
			stake: 2n * WAD,
			rewardDebt: (5n * WAD) / 100n,
		});
		expect(claimable(l, 'bob')).toBe((75n * WAD) / 1_000n);
		expect(pending(l, 'alice')).toBe(0n);

		// A later fee from bob reaches alice's residual through the re-based debt: her 2 TRUST are two
		// sevenths of the cohort that keeps the slice.
		redeem(l, 'bob', 1n * WAD, (4n * WAD) / 10n);
		expect(pending(l, 'alice')).toBe(66_666_666_666_666_666n);
	});

	it('settles pending earnings before the exit and keeps them claimable', () => {
		const l = ledger({ redeemToFulcrumTiersBps: 10_000n });
		deposit(l, 'alice', 15n * WAD, 0n); // lots at tiers 0 and 1
		deposit(l, 'bob', 3n * WAD, 0n); // tier 1
		redeem(l, 'bob', 1n * WAD, 1n * WAD); // pays alice's tier-0 lot through the fulcrum leg

		const earnedBefore = claimable(l, 'alice');
		expect(earnedBefore).toBe(WAD);

		const result = redeem(l, 'alice', 5n * WAD, 0n);
		expect(result.exiterAfter.settled).toBe(earnedBefore);
		expect(pending(l, 'alice')).toBe(0n);
		expect(claimable(l, 'alice')).toBe(earnedBefore);
	});

	it('reroutes an orphaned exiting-tier slice to the nearest eligible tier above', () => {
		// test_recordRedeem_whaleExit_reroutesToNearestTierAbove
		const l = ledger();
		deposit(l, 'alice', 10n * WAD, 0n); // one lot at tier 0
		deposit(l, 'bob', 12n * WAD, 0n); // the whole tier-1 band
		deposit(l, 'carol', 20n * WAD, 0n); // 14.4 at tier 2, 5.6 at tier 3
		expect(topTier(l, 'bob')).toBe(1n);
		expect(topTier(l, 'carol')).toBe(3n);

		const result = redeem(l, 'bob', 12n * WAD, 1n * WAD);

		expect(result.perTier).toEqual([{ tier: 2n, amount: WAD, accDelta: 69_444_444_444_444_444n }]);
		expectApprox(claimable(l, 'carol'), WAD, 10n);
		expect(claimable(l, 'alice')).toBe(0n);
		expect(l.protocolAccrued).toBe(0n);
	});

	it('reroutes below when no tier above holds eligible stake', () => {
		// test_recordRedeem_whaleExit_reroutesBelowWhenNothingAbove
		const l = ledger();
		deposit(l, 'alice', 10n * WAD, 0n);
		deposit(l, 'bob', 7n * WAD, 0n); // sole holder of tier 1, the top occupied tier

		const result = redeem(l, 'bob', 7n * WAD, 1n * WAD);

		expect(result.perTier).toEqual([{ tier: 0n, amount: WAD, accDelta: WAD / 10n }]);
		expect(claimable(l, 'alice')).toBe(WAD);
		expect(l.protocolAccrued).toBe(0n);
	});

	it('forfeits to the protocol when the sole holder exits fully', () => {
		// test_recordRedeem_soleHolderFullExit_forfeitsToProtocol
		const l = ledger();
		deposit(l, 'alice', 15n * WAD, 0n);

		const result = redeem(l, 'alice', 15n * WAD, 1n * WAD);

		// Both lots unwind, highest first, and each portion's fee is charged at its own lot's rate:
		// 250bps on the 5 at tier 1, 200bps on the 10 at tier 0.
		expect(result.lots).toEqual([
			{ tier: 1n, shares: 5n * WAD, fee: 384_615_384_615_384_615n },
			{ tier: 0n, shares: 10n * WAD, fee: 615_384_615_384_615_385n },
		]);
		expect(result.perTier).toEqual([]);
		expect(result.toProtocol).toBe(WAD);
		expect(claimable(l, 'alice')).toBe(0n);
	});

	it('keeps the slice in the exiting tier while a residual cohort remains', () => {
		// test_recordRedeem_exitTierHasCohort_noReroute
		const l = ledger();
		deposit(l, 'alice', 15n * WAD, 0n); // 10 at tier 0, 5 at tier 1
		deposit(l, 'bob', 3n * WAD, 0n);
		deposit(l, 'carol', 2n * WAD, 0n);

		const result = redeem(l, 'bob', 3n * WAD, 1n * WAD);

		// alice's 5 and carol's 2 fill 7 of the 12 TRUST band, so tier 1 keeps 7/12 of the slice and
		// the rest reroutes to alice's tier 0, the first eligible tier the walk reaches.
		expect(result.perTier).toEqual([
			{ tier: 0n, amount: 416_666_666_666_666_667n, accDelta: 41_666_666_666_666_666n },
			{ tier: 1n, amount: 583_333_333_333_333_333n, accDelta: 83_333_333_333_333_333n },
		]);
		expect(claimable(l, 'carol')).toBe(166_666_666_666_666_666n);
		expect(claimable(l, 'alice')).toBe(833_333_333_333_333_325n);
		expect(l.protocolAccrued).toBe(0n);
	});

	it('reroutes a sub-floor cohort slice to a neighbouring tier instead of forfeiting it', () => {
		const l = ledger({ minEligibleTierStakeBps: 5_000n });
		deposit(l, 'alice', 15n * WAD, 0n); // 10 at tier 0, 5 at tier 1
		deposit(l, 'bob', 3n * WAD, 0n);

		// alice's residual 5 at tier 1 is under the 6 TRUST floor, so the exiting-tier slice walks on
		// rather than accruing to the protocol; tiers 2-4 are empty and her full tier-0 lot takes it
		// whole.
		const result = redeem(l, 'bob', 3n * WAD, 1n * WAD);

		expect(result.perTier).toEqual([{ tier: 0n, amount: WAD, accDelta: WAD / 10n }]);
		expect(result.toProtocol).toBe(0n);
		expect(claimable(l, 'alice')).toBe(WAD);
	});

	it('matches the contract on the diamond-slice probe, wei for wei', () => {
		// The `diamond_slice` vector of the Solidity parity fixture, on its own probe ladder: flat
		// 100 TRUST bands, a 40 TRUST leaver and a 60 TRUST stayer sharing tier 0, and a full band in
		// tier 1 while the vault sits in tier 2.
		const probe: DynamicFeeConfig = {
			...config,
			width0: 100n * WAD,
			tierCount: 13n,
			tierWidthGrowthBps: 0n,
			depositFulcrumAlphaBps: 0n,
			depositKernelSpread: 6n * WAD,
			redeemFulcrumAlphaBps: 0n,
			redeemKernelSpread: 6n * WAD,
		};

		const result = dynamicFeeDistributeRedeem({
			startAssets: 200n * WAD,
			shares: 40n * WAD,
			feeAmount: 1_000n * WAD,
			config: probe,
			occupancy: new Map([
				[0n, 100n * WAD],
				[1n, 100n * WAD],
			]),
			exiter: new Map([[0n, { stake: 40n * WAD, rewardDebt: 0n }]]),
		});

		const earned = (tier: bigint, stake: bigint) =>
			mulDivDown(stake, result.perTier.find((entry) => entry.tier === tier)?.accDelta ?? 0n, ACC);
		// The stayer fills 60% of the band, so it keeps 600 of the 1,000 slice; the 400 it cannot
		// take reroutes whole to the full band above, the first tier the walk reaches.
		expect(earned(0n, 60n * WAD)).toBe(600n * WAD);
		expect(earned(1n, 100n * WAD)).toBe(400n * WAD);
		expect(result.toProtocol).toBe(0n);
		expect(result.exiterAfter.settled).toBe(0n);
	});

	it('never offers a rerouted exiting-tier remainder back to the cohort that declined it', () => {
		// The exiting tier is also a prior tier of the spread. What its cohort cannot take walks to a
		// neighbouring tier and stops there; it never rejoins the pool, so the thin cohort is not
		// offered a second helping of the slice it already kept its fill of. The fulcrum half still
		// reaches that tier as a prior tier, which is a different entitlement.
		const l = ledger({ redeemToFulcrumTiersBps: 5_000n });
		deposit(l, 'alice', 10n * WAD, 0n); // fills tier 0
		deposit(l, 'bob', 3n * WAD, 0n); // a thin tier-1 lot
		deposit(l, 'carol', 9n * WAD, 0n); // completes the tier-1 band; the vault reaches tier 2

		const result = redeem(l, 'carol', 9n * WAD, WAD);

		// Half the fee is the exiting-tier slice. bob's 3 fill a quarter of the 12 TRUST band, so he
		// keeps a quarter of it and the remainder reroutes whole to alice's full tier 0.
		const exitSlice = WAD / 2n;
		const bobFill = exitSlice / 4n;
		const rerouted = exitSlice - bobFill;
		// The other half spreads from tier 2: tier 1's effective weight is 0.75 * 3/12 and tier 0's is
		// 0.5 * 10/10, against the 1.25 a ladder holding exactly its widths would carry.
		const spreadToBob = (exitSlice * 1_875n) / 12_500n;
		const spreadToAlice = (exitSlice * 5_000n) / 12_500n;

		expect(result.perTier).toEqual([
			{
				tier: 0n,
				amount: rerouted + spreadToAlice,
				accDelta: rerouted / 10n + spreadToAlice / 10n,
			},
			{ tier: 1n, amount: bobFill + spreadToBob, accDelta: bobFill / 3n + spreadToBob / 3n },
		]);
		// Had the remainder rejoined the pool, bob's tier would have been weighted against it again.
		expect(result.perTier.find((entry) => entry.tier === 1n)?.amount).toBe(bobFill + spreadToBob);
		expect(claimable(l, 'bob')).toBe(3n * (bobFill / 3n + spreadToBob / 3n));
		expect(claimable(l, 'alice')).toBe(rerouted + spreadToAlice);
		expect(claimable(l, 'carol')).toBe(0n);
		// The prior ladder holds 0.6875 of the 1.25 the schedule normalizes over, so the rest of the
		// fulcrum half has no stake there to earn it.
		expect(result.toProtocol).toBe(exitSlice - spreadToBob - spreadToAlice);
	});

	it('accrues what the exiting-tier walk exhausts rather than adding it to the spread', () => {
		// Flat 10 TRUST bands with every tier holding two of them, so no tier can absorb a whole
		// credit and the reroute walk leaves a residue. The vault sits in tier 2, so the spread is
		// live — which is what makes the routing question observable: the residue must NOT swell the
		// pool, because tiers 0 and 1 have already taken their fill of it on the walk.
		const flat: DynamicFeeConfig = {
			...config,
			tierWidthGrowthBps: 0n,
			redeemToFulcrumTiersBps: 5_000n,
		};
		const cohort = 2n * WAD;

		const result = dynamicFeeDistributeRedeem({
			startAssets: 25n * WAD,
			shares: cohort,
			feeAmount: WAD,
			config: flat,
			occupancy: new Map([
				[0n, cohort],
				[1n, cohort],
				[2n, cohort + cohort], // the exiter's lot plus a stayer's
			]),
			exiter: new Map([[2n, { stake: cohort, rewardDebt: 0n }]]),
		});

		// Half the fee is the exiting-tier slice. Each tier takes a fifth of what reaches it — two of
		// its ten TRUST — so the walk runs tier 2, then above (empty), then down through 1 and 0.
		const fill = (amount: bigint) => (amount * 2n) / 10n;
		const exitSlice = WAD / 2n;
		const atTier2 = fill(exitSlice);
		const atTier1 = fill(exitSlice - atTier2);
		const atTier0 = fill(exitSlice - atTier2 - atTier1);
		const leftover = exitSlice - atTier2 - atTier1 - atTier0;

		// The other half spreads on its own. Effective weights are 0.75 * 0.2 and 0.5 * 0.2 against
		// the 1.25 reference; the pool is `fulcrum`, never `fulcrum + leftover`.
		const fulcrum = WAD / 2n;
		const spreadToTier1 = (fulcrum * 15n) / 125n;
		const spreadToTier0 = (fulcrum * 10n) / 125n;

		expect(result.perTier).toEqual([
			{ tier: 0n, amount: atTier0 + spreadToTier0, accDelta: (atTier0 + spreadToTier0) / 2n },
			{ tier: 1n, amount: atTier1 + spreadToTier1, accDelta: (atTier1 + spreadToTier1) / 2n },
			{ tier: 2n, amount: atTier2, accDelta: atTier2 / 2n },
		]);
		expect(result.toProtocol).toBe(leftover + (fulcrum - spreadToTier1 - spreadToTier0));
		expect(leftover).toBeGreaterThan(0n);
	});

	it('pays the fulcrum share to the drawn lots’ cohorts when the spread can place nothing', () => {
		// The vault never leaves tier 0, so the spread has no prior tier at all. The fulcrum share
		// falls back to the cohorts of the tiers this redeem drew from, capped at their fill. The
		// leftover from the exiting-tier slice reaches neither route: that cohort has already taken
		// its fill of it, so a second offer would pay it above the schedule rate.
		const l = ledger({ redeemToFulcrumTiersBps: 5_000n });
		deposit(l, 'alice', 6n * WAD, 0n);
		deposit(l, 'bob', 3n * WAD, 0n); // still inside the 10 TRUST tier-0 band

		const result = redeem(l, 'bob', 3n * WAD, WAD);

		// Each half is offered to alice's 6 of the 10 TRUST band separately and capped at that fill,
		// so she takes 0.6 of each and 0.4 of each is left with nobody to earn it.
		const half = WAD / 2n;
		const cohortTake = (half * 6n) / 10n;
		expect(result.perTier).toEqual([
			{ tier: 0n, amount: 2n * cohortTake, accDelta: 2n * (cohortTake / 6n) },
		]);
		expect(claimable(l, 'alice')).toBe(6n * (2n * (cohortTake / 6n)));
		// Both remainders reach the protocol untouched. Re-offering the leftover would have handed the
		// cohort `(half + leftover) * 6 / 10` on the second pass instead of `half * 6 / 10`.
		expect(result.toProtocol).toBe(2n * (half - cohortTake));
	});

	it('drops the top lot back once the high lot is drained', () => {
		// test_recordRedeem_topLotDropsBackOnceTheHighLotIsDrained
		const l = ledger();
		deposit(l, 'alice', 10n * WAD, 0n); // alice's lot at tier 0
		deposit(l, 'bob', 30n * WAD, 0n); // 12 at tier 1, 14.4 at tier 2, 3.6 at tier 3
		expect(dynamicFeeTierOf(l.vaultStake, l.config)).toBe(3n);

		deposit(l, 'alice', 1n * WAD, 0n); // a sliver at the vault's tier
		expect(topTier(l, 'alice')).toBe(3n);
		expect(stakeAt(l, 'alice', 0n)).toBe(10n * WAD);

		// The next share out is priced at the top lot's tier (350bps), not at tier 0's 200bps.
		expect(quote(l, 'alice', WAD)).toBe((35n * WAD) / 1_000n);

		redeem(l, 'alice', 1n * WAD, 0n);

		expect(topTier(l, 'alice')).toBe(0n);
		expect(quote(l, 'alice', 10n * WAD)).toBe((2n * WAD) / 10n);
	});

	it('prices a redeem straddling two lots at each lot’s own rate', () => {
		// test_recordRedeem_unwindsLotsHighestTierFirst
		const l = ledger();
		deposit(l, 'alice', 25n * WAD, 0n); // 10 at tier 0, 12 at tier 1, 3 at tier 2
		expect(topTier(l, 'alice')).toBe(2n);

		// Exactly the tier-2 lot: priced at tier 2 alone, and the top lot drops to tier 1.
		expect(quote(l, 'alice', 3n * WAD)).toBe((9n * WAD) / 100n);
		redeem(l, 'alice', 3n * WAD, (9n * WAD) / 100n);
		expect(topTier(l, 'alice')).toBe(1n);
		expect(l.occupancy.get(2n)).toBe(0n);

		// 16 out draws the whole tier-1 lot and 4 from tier 0: 250bps on 12, then 200bps on 4.
		const straddleFee = (3n * WAD) / 10n + (8n * WAD) / 100n;
		expect(quote(l, 'alice', 16n * WAD)).toBe(straddleFee);

		const result = redeem(l, 'alice', 16n * WAD, straddleFee);

		expect(result.lots).toEqual([
			{ tier: 1n, shares: 12n * WAD, fee: (3n * WAD) / 10n },
			{ tier: 0n, shares: 4n * WAD, fee: (8n * WAD) / 100n },
		]);
		expect(topTier(l, 'alice')).toBe(0n);
		expect(stakeAt(l, 'alice', 0n)).toBe(6n * WAD);
		expect(result.exiterAfter.stake).toBe(6n * WAD);
		// alice is the only holder, so with her excluded no tier is eligible anywhere.
		expect(result.toProtocol).toBe(straddleFee);

		redeem(l, 'alice', 6n * WAD, 0n);
		expect(topTier(l, 'alice')).toBe(DYNAMIC_FEE_NO_LOT);
	});

	it('leaves an exiter holding lots at several tiers earning nothing anywhere', () => {
		// test_recordRedeem_exiterWithLotsAtSeveralTiersEarnsNothingAnywhere
		const l = ledger({ redeemToFulcrumTiersBps: 5_000n });
		deposit(l, 'alice', 10n * WAD, 0n); // alice's lot at tier 0
		deposit(l, 'bob', 12n * WAD, 0n); // bob fills tier 1
		deposit(l, 'carol', 6n * WAD, 0n); // carol at tier 2
		deposit(l, 'alice', 4n * WAD, 0n); // alice's second lot, also at tier 2
		expect([...lotsOf(l, 'alice').keys()]).toEqual([0n, 2n]);
		const aliceBefore = claimable(l, 'alice');

		// Half the fee is the exiting-tier slice, capped at carol's fill of the 14.4 TRUST band; what
		// she cannot take walks past the empty tiers above and lands whole on bob's full tier 1. The
		// other half spreads from tier 2, where tier 1 is the only eligible prior tier — alice's own
		// lot is the whole of tier 0 — so bob is credited twice, once per route. Two credits mean two
		// per-share truncations rather than one, which is where the last few wei go.
		const result = redeem(l, 'alice', 2n * WAD, WAD);

		expect(claimable(l, 'alice')).toBe(aliceBefore);
		const exitSlice = WAD / 2n;
		const carolFill = (exitSlice * 60n) / 144n;
		const rerouted = exitSlice - carolFill;
		// Tier 1 carries the full kernel weight 0.75 against the 1.25 reference; tier 0 is empty once
		// alice is excluded, so the rest of the fulcrum half has nobody to earn it.
		const spreadToBob = (exitSlice * 7_500n) / 12_500n;

		expect(result.perTier).toEqual([
			{ tier: 1n, amount: rerouted + spreadToBob, accDelta: rerouted / 12n + spreadToBob / 12n },
			{ tier: 2n, amount: carolFill, accDelta: carolFill / 6n },
		]);
		expect(claimable(l, 'carol')).toBe(6n * (carolFill / 6n));
		expect(claimable(l, 'bob')).toBe(12n * (rerouted / 12n + spreadToBob / 12n));
		expect(result.toProtocol).toBe(exitSlice - spreadToBob);
		expect(stakeAt(l, 'alice', 2n)).toBe(2n * WAD);
		expect(stakeAt(l, 'alice', 0n)).toBe(10n * WAD);
	});

	it('does not depend on the deposit kernel pair', () => {
		const run = (depositFulcrumAlphaBps: bigint, depositKernelSpread: bigint) => {
			const l = ledger({
				depositFulcrumAlphaBps,
				depositKernelSpread,
				redeemFulcrumAlphaBps: 5_000n,
				redeemToFulcrumTiersBps: 6_000n,
			});
			deposit(l, 'alice', 10n * WAD, 0n);
			deposit(l, 'bob', 12n * WAD, 0n);
			deposit(l, 'carol', (144n * WAD) / 10n, 0n);
			deposit(l, 'dave', (1_728n * WAD) / 100n, 0n);
			deposit(l, 'eve', (20_736n * WAD) / 1_000n, 0n);
			deposit(l, 'frank', 1n * WAD, 0n);
			return redeem(l, 'eve', 20n * WAD, 7n * WAD);
		};
		expect(run(0n, WAD + 1n)).toEqual(run(10_000n, 4n * WAD));
	});

	it('rejects shares above the recorded stake', () => {
		expect(() =>
			dynamicFeeDistributeRedeem({
				startAssets: 10n * WAD,
				shares: 4n * WAD,
				feeAmount: 0n,
				config,
				occupancy: new Map([[0n, 10n * WAD]]),
				exiter: new Map([[0n, { stake: 3n * WAD, rewardDebt: 0n }]]),
			})
		).toThrow();
	});

	it('conserves the fee across seeded lots, occupancies, floors, and kernel pairs', () => {
		let seed = 0x9e37_79b9n;
		const next = (bound: bigint) => {
			seed = (seed * 6_364_136_223_846_793_005n + 1_442_695_040_888_963_407n) % 2n ** 64n;
			return (seed >> 11n) % bound;
		};

		for (let round = 0; round < 200; round++) {
			const floor = next(4n) === 0n ? 0n : next(10_001n);
			const runConfig: DynamicFeeConfig = {
				...config,
				redeemToFulcrumTiersBps: next(10_001n),
				redeemFulcrumAlphaBps: next(10_001n),
				redeemKernelSpread: WAD + 1n + next(8n * WAD),
				minEligibleTierStakeBps: floor,
			};

			// Seed each tier's cohort, then give the exiter a lot at a random subset of the occupied
			// tiers, never more than that tier holds.
			const occupancy: DynamicFeeTierOccupancy = new Map();
			const exiter: DynamicFeeLots = new Map();
			let vaultStake = 0n;
			let exiterStake = 0n;
			for (let tier = 0n; tier < config.tierCount; tier++) {
				const cohort = next(3n) === 0n ? 0n : next(30n * WAD);
				const lot = next(3n) === 0n ? 0n : 1n + next(10n * WAD);
				occupancy.set(tier, cohort + lot);
				vaultStake += cohort + lot;
				if (lot > 0n) {
					exiter.set(tier, { stake: lot, rewardDebt: next(WAD) });
					exiterStake += lot;
				}
			}
			if (exiterStake === 0n) {
				exiter.set(0n, { stake: WAD, rewardDebt: 0n });
				occupancy.set(0n, (occupancy.get(0n) ?? 0n) + WAD);
				vaultStake += WAD;
				exiterStake = WAD;
			}
			const shares = 1n + next(exiterStake);
			const feeAmount = 1n + next(WAD);

			const result = dynamicFeeDistributeRedeem({
				startAssets: vaultStake,
				shares,
				feeAmount,
				config: runConfig,
				occupancy,
				exiter,
			});

			let credited = 0n;
			let paid = 0n;
			for (const payout of result.perTier) {
				const residual = result.exiterAfter.lots.get(payout.tier)?.stake ?? 0n;
				const denominator = (result.occupancyAfter.get(payout.tier) ?? 0n) - residual;
				expect(payout.amount).toBeGreaterThan(0n);
				expect(denominator).toBeGreaterThan(0n);
				credited += payout.amount;
				paid += mulDivDown(payout.accDelta, denominator, ACC);
			}

			// Every wei of the fee is either credited to a cohort or accrued to the protocol; what the
			// per-share division truncates is under one wei per credit. A redeem writes at most one
			// exiting-tier credit plus a reroute walk per lot drawn, one per prior tier in the spread
			// plus its remainder, and one per lot again in the no-spread fallback.
			const creditBound =
				BigInt(result.lots.length) * (config.tierCount + 1n) + config.tierCount + 1n;
			expect(credited + result.toProtocol).toBe(feeAmount);
			expect(paid + result.toProtocol).toBeLessThanOrEqual(feeAmount);
			expect(paid + result.toProtocol + creditBound).toBeGreaterThanOrEqual(feeAmount);

			let drawn = 0n;
			for (const draw of result.lots) {
				drawn += draw.shares;
			}
			expect(drawn).toBe(shares);
			expect(result.exiterAfter.stake).toBe(exiterStake - shares);
		}
	});
});

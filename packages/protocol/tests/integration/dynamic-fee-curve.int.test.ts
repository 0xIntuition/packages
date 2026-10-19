/**
 * Quote and curve maths against the chain, on the LAUNCH schedule.
 *
 * Deploys `DynamicFeeFlatPriceCurve` from the packaged bytecode behind the packaged proxy, registers
 * it, and trades through MultiVault on fresh atoms. Every trade is priced and replayed off chain
 * with `@0xintuition/curves` and the `@0xintuition/protocol` read wrappers BEFORE it lands, then the
 * receipt and the curve's storage are read back and compared to the wei.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	DYNAMIC_FEE_NO_LOT,
	dynamicFeeDepositFeeBps,
	dynamicFeeProjectHolderEarning,
	dynamicFeeQuoteDepositFee,
	dynamicFeeQuoteRedeemFee,
	dynamicFeeRedeemFeeBps,
	dynamicFeeTierOf,
	dynamicFeeTierUpperEdge,
	dynamicFeeTierWidthAt,
} from '@0xintuition/curves';
import { type Address, type Hex, toHex, zeroAddress } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	baseCurveHasDepositFeeHook,
	baseCurveHasRedeemFeeHook,
	bondingCurveRegistryCurveIds,
	bondingCurveRegistryGetCurveName,
	dynamicFeeFlatPriceCurveClaim,
	dynamicFeeFlatPriceCurveClaimable,
	dynamicFeeFlatPriceCurveClaimableAcross,
	dynamicFeeFlatPriceCurveDepositFeeBps,
	dynamicFeeFlatPriceCurveMultiVaultAddress,
	dynamicFeeFlatPriceCurveName,
	dynamicFeeFlatPriceCurveRedeemFeeBps,
	dynamicFeeFlatPriceCurveTierOf,
	dynamicFeeFlatPriceCurveTierUpperEdge,
	dynamicFeeFlatPriceCurveTierWidthAt,
	eventParseClaimed,
	multiVaultCalculateTripleId,
	multiVaultCreateTriples,
	multiVaultGetCounterIdFromTripleId,
	multiVaultGetTripleCost,
	multiVaultGetVault,
	multiVaultResolveVaultTotals,
} from '../../src';
import { DynamicFeeFlatPriceCurveAbi } from '../../src/contracts';
import {
	DYNAMIC_FEE_CURVE_NAME,
	DYNAMIC_FEE_LAUNCH_CONFIG,
} from '../helpers/deploy-dynamic-fee-curve';
import {
	ACC,
	type Actor,
	accumulatorsOf,
	createAtom,
	type DepositRun,
	type DynamicFeeContext,
	denseByTier,
	findAssetsForShares,
	fundedActor,
	gasCost,
	loadDynamicFeeContext,
	lotTriples,
	pendingFromLots,
	type RedeemRun,
	readAccount,
	readCurve,
	runDeposit,
	runRedeem,
	waitForSuccess,
} from '../helpers/dynamic-fee-harness';
import { publicClient, walletClient } from '../helpers/utils';

const TRUST = 10n ** 18n;
const BIG_BALANCE = 2_000_000n * TRUST;

let ctx: DynamicFeeContext;

beforeAll(async () => {
	ctx = await loadDynamicFeeContext();
}, 300_000);

/* ============================== shared property checks ============================== */

/**
 * Registers one `it` per property of a deposit. `getRun` is read lazily because the run executes in
 * the enclosing `describe`'s `beforeAll`.
 */
function depositChecks(getRun: () => DepositRun) {
	it('curve fee: curves replica == on-chain quoteDepositFee == DepositRecorded.fee == sum of band fees', () => {
		const run = getRun();
		expect(run.composed.curveFee).toBe(run.onchainQuoteFee);
		expect(dynamicFeeQuoteDepositFee(run.before.vaultStake, run.composed.feeBase, ctx.config)).toBe(
			run.onchainQuoteFee
		);
		expect(run.recorded.fee).toBe(run.onchainQuoteFee);
		expect(run.bandEvents.reduce((sum, band) => sum + band.fee, 0n)).toBe(run.onchainQuoteFee);
	});

	it('fee walk vs landing walk: same start, contiguous, the fee walk at most one band further', () => {
		const run = getRun();
		const sourceTier = dynamicFeeTierOf(run.before.vaultStake, ctx.config);
		const quoteTiers = run.composed.bands.map((band) => band.tier);
		const landedTiers = run.bandEvents.map((band) => band.tier);
		expect(run.recorded.sourceTier).toBe(sourceTier);
		expect(quoteTiers[0]).toBe(sourceTier);
		expect(landedTiers[0]).toBe(sourceTier);
		for (const tiers of [quoteTiers, landedTiers]) {
			tiers.forEach((tier, index) => {
				if (index > 0) expect(tier).toBe((tiers[index - 1] as bigint) + 1n);
			});
		}
		expect(quoteTiers.length - landedTiers.length).toBeGreaterThanOrEqual(0);
		expect(quoteTiers.length - landedTiers.length).toBeLessThanOrEqual(1);
		expect(run.composed.bands.reduce((sum, band) => sum + band.assets, 0n)).toBe(
			run.composed.feeBase
		);
	});

	it('previewDeposit == composed off-chain quote == minted shares == recorded stake', () => {
		const run = getRun();
		expect(run.preview.shares).toBe(run.composed.shares);
		expect(run.preview.assetsAfterFees).toBe(run.composed.assetsAfterFees);
		expect(run.actorAfter.shares - run.actorBefore.shares).toBe(run.preview.shares);
		expect(run.recorded.shares).toBe(run.preview.shares);
		expect(run.deposited.shares).toBe(run.preview.shares);
		expect(run.deposited.assetsAfterFees).toBe(run.preview.assetsAfterFees);
		expect(run.actorAfter.userStake - run.actorBefore.userStake).toBe(run.preview.shares);
		expect(run.after.vaultStake - run.before.vaultStake).toBe(run.preview.shares);
	});

	it('fee split: every component lands where the quote says, and the vault stays at par', () => {
		const run = getRun();
		const { balancesBefore: b, balancesAfter: a, composed } = run;
		expect(a.curve - b.curve).toBe(composed.curveFee);
		expect(a.multiVault - b.multiVault).toBe(run.assets - composed.curveFee);
		expect(a.protocolFees - b.protocolFees).toBe(composed.protocolFee);
		expect(a.atomWalletFees - b.atomWalletFees).toBe(composed.termFee);
		expect(a.defaultVault.totalAssets - b.defaultVault.totalAssets).toBe(composed.entryFee);
		expect(a.defaultVault.totalShares).toBe(b.defaultVault.totalShares);
		const seedShares = composed.isNewVault ? ctx.minShare : 0n;
		expect(a.vault.totalAssets - b.vault.totalAssets).toBe(
			composed.assetsAfterFees + composed.minShareCost
		);
		expect(a.vault.totalShares - b.vault.totalShares).toBe(composed.shares + seedShares);
		expect(a.vault.totalAssets).toBe(a.vault.totalShares);
	});

	it('DepositBandRecorded equals the replica landing band for band', () => {
		const run = getRun();
		expect(run.bandEvents).toEqual(run.replica.bands);
	});

	it('distribution: tierStake, accFeePerShare and protocolAccrued equal the replica', () => {
		const run = getRun();
		const { replica } = run;
		expect(run.after.tierStake).toEqual(denseByTier(replica.occupancyAfter, ctx.config.tierCount));
		expect(run.after.accFeePerShare).toEqual(
			denseByTier(replica.accFeePerShareAfter, ctx.config.tierCount)
		);
		expect(run.after.protocolAccrued - run.before.protocolAccrued).toBe(replica.toProtocol);
		const credited = replica.perTier.reduce((sum, payout) => sum + payout.amount, 0n);
		expect(credited + replica.toProtocol).toBe(run.onchainQuoteFee);
	});

	it('depositor: lots, reward debts, top tier, banked and pending equal the replica', () => {
		const run = getRun();
		const { replica } = run;
		expect(lotTriples(run.actorAfter.lots)).toEqual(lotTriples(replica.depositorAfter));
		expect(run.actorAfter.topTier).toBe(replica.topTierAfter);
		expect(run.recorded.topTier).toBe(replica.topTierAfter);
		expect(run.actorAfter.banked - run.actorBefore.banked).toBe(replica.banked);
		expect(run.actorAfter.pending).toBe(
			pendingFromLots(replica.depositorAfter, replica.accFeePerShareAfter)
		);
	});

	it('holders: each pendingFor delta equals dynamicFeeProjectHolderEarning', () => {
		const run = getRun();
		for (const [holder, before] of run.holdersBefore) {
			const after = run.holdersAfter.get(holder);
			expect(after).toBeDefined();
			const projected = dynamicFeeProjectHolderEarning({
				distribution: run.replica,
				lots: before.lots,
				accBefore: accumulatorsOf(run.before),
			});
			expect((after?.pending ?? 0n) - before.pending).toBe(projected);
		}
	});
}

function redeemChecks(getRun: () => RedeemRun) {
	it('redeem fee: curves per-lot quote == quoteRedeemFee == previewRedeemFor == RedeemRecorded.fee == sum of lot fees', () => {
		const run = getRun();
		expect(run.offchainFee).toBe(run.onchainFee);
		expect(run.previewFor.fee).toBe(run.onchainFee);
		expect(run.recorded.fee).toBe(run.onchainFee);
		expect(run.lotEvents.reduce((sum, lot) => sum + lot.fee, 0n)).toBe(run.onchainFee);
	});

	it('lot walk: quoted lots match RedeemLotRecorded tier for tier, highest first', () => {
		const run = getRun();
		expect(run.lotEvents.map((lot) => [lot.tier, lot.shares])).toEqual(
			run.quoteLots.map((charge) => [charge.tier, charge.shares])
		);
		expect(run.recorded.topTier).toBe(run.actorBefore.topTier);
		expect(run.recorded.shares).toBe(run.shares);
	});

	it('per-lot fee apportionment equals the replica', () => {
		const run = getRun();
		expect(run.lotEvents).toEqual(run.replica.lots);
	});

	it('account-less pricing: quoteRedeemFee(address(0)) prices at the vault tier, and MultiVault.previewRedeem uses it', () => {
		const run = getRun();
		expect(run.accountlessOnchainFee).toBe(run.accountlessOffchainFee);
		expect(run.multiVaultPreview.assetsAfterFees).toBe(
			run.assetsBeforeFees - run.protocolFee - run.exitFee - run.accountlessOnchainFee
		);
		expect(run.multiVaultPreview.sharesUsed).toBe(run.shares);
	});

	it('payout: received == Redeemed.assetsAfterFees == composed holder-accurate quote', () => {
		const run = getRun();
		// Flat 1:1 pricing: the gross is the share count.
		expect(run.assetsBeforeFees).toBe(run.shares);
		expect(run.previewFor.assetsAfterCurveFee).toBe(run.shares - run.onchainFee);
		expect(run.received).toBe(run.expectedAssetsOut);
		expect(run.redeemed.assetsAfterFees).toBe(run.expectedAssetsOut);
		expect(run.redeemed.totalFees).toBe(run.protocolFee + run.exitFee + run.onchainFee);
		// The documented holder-accurate composition from the account-less preview.
		expect(run.multiVaultPreview.assetsAfterFees + run.accountlessOnchainFee - run.onchainFee).toBe(
			run.received
		);
	});

	it('fee split: curve, MultiVault, protocol and default vault balances move by the quoted fees', () => {
		const run = getRun();
		const { balancesBefore: b, balancesAfter: a } = run;
		expect(a.curve - b.curve).toBe(run.onchainFee);
		expect(b.multiVault - a.multiVault).toBe(run.expectedAssetsOut + run.onchainFee);
		expect(a.protocolFees - b.protocolFees).toBe(run.protocolFee);
		expect(a.defaultVault.totalAssets - b.defaultVault.totalAssets).toBe(run.exitFee);
		expect(b.vault.totalAssets - a.vault.totalAssets).toBe(run.shares);
		expect(b.vault.totalShares - a.vault.totalShares).toBe(run.shares);
		expect(a.vault.totalAssets).toBe(a.vault.totalShares);
	});

	it('distribution: tierStake, accFeePerShare and protocolAccrued equal the replica', () => {
		const run = getRun();
		const { replica } = run;
		expect(run.after.tierStake).toEqual(denseByTier(replica.occupancyAfter, ctx.config.tierCount));
		expect(run.after.accFeePerShare).toEqual(
			denseByTier(replica.accFeePerShareAfter, ctx.config.tierCount)
		);
		expect(run.after.protocolAccrued - run.before.protocolAccrued).toBe(replica.toProtocol);
		const credited = replica.perTier.reduce((sum, payout) => sum + payout.amount, 0n);
		expect(credited + replica.toProtocol).toBe(run.onchainFee);
		expect(run.after.vaultStake).toBe(run.before.vaultStake - run.shares);
	});

	it('exiter: residual lots and debts, top tier, settled balance and zero pending equal the replica', () => {
		const run = getRun();
		const { exiterAfter } = run.replica;
		expect(lotTriples(run.actorAfter.lots)).toEqual(lotTriples(exiterAfter.lots));
		expect(run.actorAfter.topTier).toBe(exiterAfter.topTierAfter);
		expect(run.actorBefore.topTier).toBe(exiterAfter.topTierBefore);
		expect(run.actorAfter.banked - run.actorBefore.banked).toBe(exiterAfter.settled);
		expect(run.actorAfter.pending).toBe(0n);
		expect(run.actorAfter.userStake).toBe(exiterAfter.stake);
		expect(run.actorBefore.shares - run.actorAfter.shares).toBe(run.shares);
	});

	it('holders: each pendingFor delta equals dynamicFeeProjectHolderEarning', () => {
		const run = getRun();
		for (const [holder, before] of run.holdersBefore) {
			const after = run.holdersAfter.get(holder);
			const projected = dynamicFeeProjectHolderEarning({
				distribution: run.replica,
				lots: before.lots,
				accBefore: accumulatorsOf(run.before),
			});
			expect((after?.pending ?? 0n) - before.pending).toBe(projected);
		}
	});
}

/* ============================== deployment and ladder ============================== */

describe('DynamicFeeFlatPriceCurve deployed from packaged artifacts with the launch schedule', () => {
	it('the mirrored launch config equals DynamicFeeLaunchSchedule.sol field for field', () => {
		const schedulePath = resolve(
			dirname(fileURLToPath(import.meta.url)),
			'../../../../contracts/core/script/intuition/DynamicFeeLaunchSchedule.sol'
		);
		const source = readFileSync(schedulePath, 'utf8');
		const body = source.slice(source.indexOf('DynamicFeeConfig({'), source.indexOf('});'));
		const parsed: Record<string, bigint> = {};
		for (const match of body.matchAll(/(\w+):\s*(\d+)(?:e(\d+))?/g)) {
			const [, field, mantissa, exponent] = match;
			parsed[field as string] = BigInt(mantissa as string) * 10n ** BigInt(exponent ?? '0');
		}
		expect(parsed).toEqual(DYNAMIC_FEE_LAUNCH_CONFIG);
	});

	it('stores the launch config, owner, MultiVault wiring, name, hooks and registry entry', async () => {
		expect(ctx.config).toEqual(DYNAMIC_FEE_LAUNCH_CONFIG);
		const [owner, multiVault, name, hasDepositHook, hasRedeemHook, curveId, registryName] =
			await Promise.all([
				publicClient.readContract({
					address: ctx.curveAddress,
					abi: DynamicFeeFlatPriceCurveAbi,
					functionName: 'owner',
				}),
				dynamicFeeFlatPriceCurveMultiVaultAddress(ctx.curve),
				dynamicFeeFlatPriceCurveName(ctx.curve),
				baseCurveHasDepositFeeHook(ctx.curve),
				baseCurveHasRedeemFeeHook(ctx.curve),
				bondingCurveRegistryCurveIds(ctx.registry, { args: [ctx.curveAddress] }),
				bondingCurveRegistryGetCurveName(ctx.registry, { args: [ctx.curveId] }),
			]);
		expect(owner.toLowerCase()).toBe(ctx.owner.toLowerCase());
		expect(multiVault.toLowerCase()).toBe(ctx.multiVault.address.toLowerCase());
		expect(name).toBe(DYNAMIC_FEE_CURVE_NAME);
		expect(hasDepositHook).toBe(true);
		expect(hasRedeemHook).toBe(true);
		expect(curveId).toBe(ctx.curveId);
		expect(registryName).toBe(DYNAMIC_FEE_CURVE_NAME);
	});

	it('tier ladder: curves edges, widths and both fee rates equal the contract for every tier', async () => {
		for (let tier = 0n; tier < ctx.config.tierCount; tier++) {
			const [edge, width, depositBps, redeemBps] = await Promise.all([
				dynamicFeeFlatPriceCurveTierUpperEdge(ctx.curve, { args: [tier] }),
				dynamicFeeFlatPriceCurveTierWidthAt(ctx.curve, { args: [tier] }),
				dynamicFeeFlatPriceCurveDepositFeeBps(ctx.curve, { args: [tier] }),
				dynamicFeeFlatPriceCurveRedeemFeeBps(ctx.curve, { args: [tier] }),
			]);
			expect(dynamicFeeTierUpperEdge(tier, ctx.config)).toBe(edge);
			expect(dynamicFeeTierWidthAt(tier, ctx.config)).toBe(width);
			expect(dynamicFeeDepositFeeBps(tier, ctx.config)).toBe(depositBps);
			expect(dynamicFeeRedeemFeeBps(tier, ctx.config)).toBe(redeemBps);
		}
	});

	it('tierOf at every edge - 1, edge and edge + 1 wei agrees, and the top tier is unbounded', async () => {
		const probes: bigint[] = [0n, 1n, 10n ** 40n];
		for (let tier = 0n; tier < ctx.config.tierCount; tier++) {
			const edge = dynamicFeeTierUpperEdge(tier, ctx.config);
			probes.push(edge - 1n, edge, edge + 1n);
		}
		for (const assets of probes) {
			const onchain = await dynamicFeeFlatPriceCurveTierOf(ctx.curve, { args: [assets] });
			expect(dynamicFeeTierOf(assets, ctx.config)).toBe(onchain);
		}
		const firstEdge = dynamicFeeTierUpperEdge(0n, ctx.config);
		expect(dynamicFeeTierOf(firstEdge - 1n, ctx.config)).toBe(0n);
		expect(dynamicFeeTierOf(firstEdge, ctx.config)).toBe(1n);
		expect(dynamicFeeTierOf(10n ** 40n, ctx.config)).toBe(ctx.config.tierCount - 1n);
	});
});

/* ============================== scenario A ============================== */

describe('first depositor lands high: one deposit from an empty vault climbs six bands', () => {
	let whale: Actor;
	let late: Actor;
	let termId: Hex;
	let opening: DepositRun;
	let followUp: DepositRun;

	beforeAll(async () => {
		whale = await fundedActor(3, BIG_BALANCE);
		late = await fundedActor(4, BIG_BALANCE);
		termId = await createAtom(ctx, 'dynamic-fee first depositor lands high');
		opening = await runDeposit(ctx, whale, termId, 30_000n * TRUST);
		followUp = await runDeposit(ctx, late, termId, 1_000n * TRUST, { holders: [whale.address] });
	}, 300_000);

	describe('opening deposit (every prior tier empty)', () => {
		depositChecks(() => opening);

		it('lands one lot per band, each holding exactly that band, and the top lot is the last band', () => {
			const tiers = opening.bandEvents.map((band) => band.tier);
			expect(tiers).toEqual([0n, 1n, 2n, 3n, 4n, 5n]);
			expect(opening.actorAfter.lotTiers).toEqual([...tiers].reverse());
			expect(opening.actorAfter.lotStakes).toEqual(
				[...opening.bandEvents].reverse().map((band) => band.stake)
			);
			for (const band of opening.bandEvents.slice(0, -1)) {
				expect(band.stake).toBe(dynamicFeeTierWidthAt(band.tier, ctx.config));
			}
			expect(opening.actorAfter.topTier).toBe(5n);
		});

		it('the first band has no prior tier, so its whole slice accrues to the protocol', () => {
			const firstBand = opening.bandEvents[0];
			expect(firstBand?.tier).toBe(0n);
			// Tier 0 receives nothing from band 0; only later bands, sourced above it, can credit it.
			expect(opening.replica.toProtocol).toBeGreaterThanOrEqual(firstBand?.fee ?? 0n);
			expect(opening.after.protocolAccrued - opening.before.protocolAccrued).toBeGreaterThanOrEqual(
				firstBand?.fee ?? 0n
			);
		});

		it('later bands pay the depositor’s own earlier lots, which show up as pending (the replay mechanism)', () => {
			expect(opening.actorAfter.pending).toBeGreaterThan(0n);
			expect(opening.actorAfter.banked).toBe(opening.actorBefore.banked);
		});
	});

	describe('a second deposit sourced in tier 5 pays the whale across tiers 0..4', () => {
		depositChecks(() => followUp);

		it('the whale earns, and the earning is exactly the projected one', () => {
			const before = followUp.holdersBefore.get(whale.address);
			const after = followUp.holdersAfter.get(whale.address);
			expect((after?.pending ?? 0n) - (before?.pending ?? 0n)).toBeGreaterThan(0n);
		});
	});
});

/* ============================== scenario B ============================== */

describe('full unwind, claim, then a deposit into a tier whose prior tier is empty', () => {
	let early: Actor;
	let mid: Actor;
	let newcomer: Actor;
	let termId: Hex;
	let earlyDeposit: DepositRun;
	let midDeposit: DepositRun;
	let fullUnwind: RedeemRun;
	let emptyPriorDeposit: DepositRun;
	let midPartialRedeem: RedeemRun;

	beforeAll(async () => {
		early = await fundedActor(5, BIG_BALANCE);
		mid = await fundedActor(6, BIG_BALANCE);
		newcomer = await fundedActor(7, BIG_BALANCE);
		termId = await createAtom(ctx, 'dynamic-fee full unwind');

		earlyDeposit = await runDeposit(ctx, early, termId, 5_000n * TRUST);
		midDeposit = await runDeposit(ctx, mid, termId, 4_000n * TRUST, { holders: [early.address] });
		fullUnwind = await runRedeem(ctx, early, termId, earlyDeposit.actorAfter.shares, [mid.address]);
	}, 300_000);

	describe('early deposit into a new vault', () => {
		depositChecks(() => earlyDeposit);

		it('nets the min-share bootstrap out of the fee base on the opening deposit', () => {
			expect(earlyDeposit.composed.isNewVault).toBe(true);
			expect(earlyDeposit.composed.minShareCost).toBeGreaterThan(0n);
			expect(earlyDeposit.composed.feeBase).toBe(
				earlyDeposit.assets - earlyDeposit.composed.minShareCost
			);
			expect(earlyDeposit.actorAfter.lotTiers).toEqual([2n, 1n, 0n]);
		});
	});

	describe('mid deposit pays the early holder', () => {
		depositChecks(() => midDeposit);
	});

	describe('FULL UNWIND: the early holder redeems every share across three lots', () => {
		redeemChecks(() => fullUnwind);

		it('leaves no lot: userLots empty, userTopTier is the NO_LOT sentinel, userStake and shares zero', () => {
			expect(fullUnwind.lotEvents.map((lot) => lot.tier)).toEqual([2n, 1n, 0n]);
			expect(fullUnwind.actorAfter.lotTiers).toEqual([]);
			expect(fullUnwind.actorAfter.topTier).toBe(DYNAMIC_FEE_NO_LOT);
			expect(fullUnwind.actorAfter.topTier).toBe(256n);
			expect(fullUnwind.actorAfter.userStake).toBe(0n);
			expect(fullUnwind.actorAfter.shares).toBe(0n);
			expect(fullUnwind.replica.exiterAfter.topTierAfter).toBe(DYNAMIC_FEE_NO_LOT);
			expect(fullUnwind.after.tierStake[0]).toBe(0n);
			expect(fullUnwind.after.tierStake[1]).toBe(0n);
		});

		it('pendingFor is zero, claimable == claimableAcross == bankedEarnings, and the claim pays exactly that', async () => {
			const banked = fullUnwind.actorAfter.banked;
			expect(banked).toBeGreaterThan(0n);
			expect(fullUnwind.actorAfter.pending).toBe(0n);
			const [claimable, claimableAcross] = await Promise.all([
				dynamicFeeFlatPriceCurveClaimable(ctx.curve, { args: [early.address, termId] }),
				dynamicFeeFlatPriceCurveClaimableAcross(ctx.curve, { args: [early.address, [termId]] }),
			]);
			expect(claimable).toBe(banked);
			expect(claimableAcross).toBe(banked);

			const curveBefore = await publicClient.getBalance({ address: ctx.curveAddress });
			const balanceBefore = await publicClient.getBalance({ address: early.address });
			const hash = await dynamicFeeFlatPriceCurveClaim(
				{ address: ctx.curveAddress, walletClient: early.wallet, publicClient },
				{ args: [[termId]] }
			);
			const receipt = await waitForSuccess(hash);
			const claimed = await eventParseClaimed(publicClient, hash);
			const balanceAfter = await publicClient.getBalance({ address: early.address });
			const curveAfter = await publicClient.getBalance({ address: ctx.curveAddress });

			expect(claimed).toHaveLength(1);
			expect(claimed[0]?.args.amount).toBe(banked);
			expect(balanceAfter - balanceBefore + gasCost(receipt)).toBe(banked);
			expect(curveBefore - curveAfter).toBe(banked);
			const after = await readAccount(ctx, termId, early.address);
			expect(after.banked).toBe(0n);
			await expect(
				dynamicFeeFlatPriceCurveClaim(
					{ address: ctx.curveAddress, walletClient: early.wallet, publicClient },
					{ args: [[termId]] }
				)
			).rejects.toThrow(/NothingToClaim/);
		});
	});

	describe('EMPTY prior tier: a deposit sourced in tier 1 with tier 0 empty accrues its whole fee to the protocol', () => {
		beforeAll(async () => {
			emptyPriorDeposit = await runDeposit(ctx, newcomer, termId, 100n * TRUST, {
				holders: [mid.address],
			});
		}, 300_000);

		depositChecks(() => emptyPriorDeposit);

		it('every prior tier is empty, so protocolAccrued grows by the entire curve fee and no accumulator moves', () => {
			expect(emptyPriorDeposit.recorded.sourceTier).toBe(1n);
			expect(emptyPriorDeposit.before.tierStake[0]).toBe(0n);
			expect(
				emptyPriorDeposit.after.protocolAccrued - emptyPriorDeposit.before.protocolAccrued
			).toBe(emptyPriorDeposit.onchainQuoteFee);
			expect(emptyPriorDeposit.replica.perTier).toEqual([]);
			expect(emptyPriorDeposit.after.accFeePerShare).toEqual(
				emptyPriorDeposit.before.accFeePerShare
			);
		});
	});

	describe('a holder above the vault tier redeems across two lots', () => {
		beforeAll(async () => {
			const midLots = await readAccount(ctx, termId, mid.address);
			const topLot = midLots.lotStakes[0] as bigint;
			midPartialRedeem = await runRedeem(ctx, mid, termId, topLot + 500n * TRUST, [
				newcomer.address,
			]);
		}, 300_000);

		redeemChecks(() => midPartialRedeem);

		it('prices the holder’s lots, not the vault tier: account-aware and account-less quotes diverge', () => {
			expect(midPartialRedeem.lotEvents.map((lot) => lot.tier)).toEqual([3n, 2n]);
			expect(midPartialRedeem.vaultTierBefore).toBe(1n);
			expect(midPartialRedeem.onchainFee).toBeGreaterThan(midPartialRedeem.accountlessOnchainFee);
		});

		it('the exiting-tier slices reroute to the only other holder, capped at its fill of tier 1', () => {
			const tierOne = midPartialRedeem.replica.perTier.find((payout) => payout.tier === 1n);
			expect(tierOne?.amount ?? 0n).toBeGreaterThan(0n);
			const newcomerStake = midPartialRedeem.before.tierStake[1] as bigint;
			expect(newcomerStake).toBeLessThan(dynamicFeeTierWidthAt(1n, ctx.config));
			expect(midPartialRedeem.replica.toProtocol).toBeGreaterThan(0n);
		});
	});
});

/* ============================== scenario C ============================== */

describe('CAP boundary: a deposit landing at the tier-0 upper edge -1, exactly, and +1 wei', () => {
	const cases = [
		{ label: 'edge - 1 wei', delta: -1n },
		{ label: 'exactly on the edge', delta: 0n },
		{ label: 'edge + 1 wei', delta: 1n },
	] as const;

	for (const { label, delta } of cases) {
		describe(label, () => {
			let seed: Actor;
			let crosser: Actor;
			let run: DepositRun;
			let edge: bigint;

			beforeAll(async () => {
				seed = await fundedActor(8, BIG_BALANCE);
				crosser = await fundedActor(9, BIG_BALANCE);
				const termId = await createAtom(ctx, `dynamic-fee cap boundary ${label}`);
				await runDeposit(ctx, seed, termId, 500n * TRUST);
				edge = dynamicFeeTierUpperEdge(0n, ctx.config);
				const vaultStake = (await readCurve(ctx, termId)).vaultStake;
				const target = edge - vaultStake + delta;
				const assets = await findAssetsForShares(ctx, termId, target);
				if (assets === undefined) {
					throw new Error(`no gross amount mints exactly ${target} shares`);
				}
				run = await runDeposit(ctx, crosser, termId, assets, { holders: [seed.address] });
				expect(run.preview.shares).toBe(target);
			}, 300_000);

			depositChecks(() => run);

			it('lands where the edge says: band split, vault tier and the holder’s top lot', () => {
				expect(run.after.vaultStake).toBe(edge + delta);
				const landed = run.bandEvents.map((band) => [band.tier, band.stake]);
				if (delta < 1n) {
					// On or below the edge the stake fits the band: one band, one lot at tier 0.
					expect(landed).toEqual([[0n, run.preview.shares]]);
					expect(run.actorAfter.topTier).toBe(0n);
				} else {
					expect(landed).toEqual([
						[0n, run.preview.shares - 1n],
						[1n, 1n],
					]);
					expect(run.actorAfter.topTier).toBe(1n);
				}
				// A vault sitting exactly on an edge is already in the next tier.
				expect(dynamicFeeTierOf(run.after.vaultStake, ctx.config)).toBe(delta < 0n ? 0n : 1n);
			});

			it('the fee walk (net of the curve fee only) reaches tier 1 even where the landing does not', () => {
				expect(run.composed.bands.map((band) => band.tier)).toEqual([0n, 1n]);
			});
		});
	}
});

/* ============================== scenario D ============================== */

describe('thin prior tier: the fulcrum spread pays at the schedule rate and books the shortfall', () => {
	let thin: Actor;
	let bulk: Actor;
	let entrant: Actor;
	let termId: Hex;
	let run: DepositRun;

	beforeAll(async () => {
		thin = await fundedActor(3, BIG_BALANCE);
		bulk = await fundedActor(4, BIG_BALANCE);
		entrant = await fundedActor(5, BIG_BALANCE);
		termId = await createAtom(ctx, 'dynamic-fee thin prior tier');
		const opening = await runDeposit(ctx, thin, termId, 2_150n * TRUST);
		await runDeposit(ctx, bulk, termId, 10_000n * TRUST);
		// Draw the thin holder down to 100 TRUST, all of it left in tier 0.
		await runRedeem(ctx, thin, termId, opening.actorAfter.shares - 100n * TRUST);
		run = await runDeposit(ctx, entrant, termId, 1_000n * TRUST, {
			holders: [thin.address, bulk.address],
		});
	}, 300_000);

	depositChecks(() => run);

	it('every prior tier is occupied, tier 0 at a twentieth of its width, yet part of the fee accrues', () => {
		expect(run.recorded.sourceTier).toBe(3n);
		expect(run.before.tierStake[0]).toBe(100n * TRUST);
		for (const tier of [0, 1, 2]) {
			expect(run.before.tierStake[tier]).toBeGreaterThan(0n);
		}
		expect(run.replica.toProtocol).toBeGreaterThan(0n);
		expect(run.after.protocolAccrued - run.before.protocolAccrued).toBe(run.replica.toProtocol);
	});

	it('the thin tier is credited in proportion to its fill: per unit of width, below its near-full neighbour', () => {
		const tierZero = run.replica.perTier.find((payout) => payout.tier === 0n);
		const tierOne = run.replica.perTier.find((payout) => payout.tier === 1n);
		expect(tierZero?.amount ?? 0n).toBeGreaterThan(0n);
		// Per unit of width, the thin tier's credit is a fraction of the near-full tier's.
		const zeroPerWidth = ((tierZero?.amount ?? 0n) * ACC) / dynamicFeeTierWidthAt(0n, ctx.config);
		const onePerWidth = ((tierOne?.amount ?? 0n) * ACC) / dynamicFeeTierWidthAt(1n, ctx.config);
		expect(zeroPerWidth).toBeLessThan(onePerWidth);
	});
});

/* ============================== scenario E ============================== */

describe('whale climbs the whole ladder into the unbounded top tier, then unwinds all 16 lots', () => {
	let whale: Actor;
	let termId: Hex;
	let climb: DepositRun;
	let unwind: RedeemRun;

	beforeAll(async () => {
		whale = await fundedActor(6, BIG_BALANCE);
		termId = await createAtom(ctx, 'dynamic-fee whole ladder');
		climb = await runDeposit(ctx, whale, termId, 600_000n * TRUST);
		unwind = await runRedeem(ctx, whale, termId, climb.actorAfter.shares);
	}, 300_000);

	describe('the climb', () => {
		depositChecks(() => climb);

		it('records 16 bands, one lot per tier, the top band taking the unbounded remainder', () => {
			const tiers = climb.bandEvents.map((band) => band.tier);
			expect(tiers).toEqual(Array.from({ length: 16 }, (_, index) => BigInt(index)));
			expect(climb.actorAfter.lotTiers).toHaveLength(16);
			expect(climb.actorAfter.topTier).toBe(15n);
			expect(dynamicFeeTierOf(climb.after.vaultStake, ctx.config)).toBe(15n);
			const lastBand = climb.bandEvents.at(-1);
			expect(lastBand?.stake).toBe(
				climb.after.vaultStake - dynamicFeeTierUpperEdge(14n, ctx.config)
			);
		});
	});

	describe('the unwind', () => {
		redeemChecks(() => unwind);

		it('draws every lot from tier 15 down to tier 0 and leaves the NO_LOT sentinel', () => {
			expect(unwind.lotEvents.map((lot) => lot.tier)).toEqual(
				Array.from({ length: 16 }, (_, index) => BigInt(15 - index))
			);
			expect(unwind.actorAfter.topTier).toBe(DYNAMIC_FEE_NO_LOT);
			expect(unwind.after.vaultStake).toBe(0n);
			expect(unwind.after.tierStake.every((stake) => stake === 0n)).toBe(true);
		});
	});
});

/* ============================== triple vault ============================== */

describe('a triple vault on the dynamic-fee curve', () => {
	let depositor: Actor;
	let run: DepositRun;
	let counterVault: { totalAssets: bigint; totalShares: bigint };

	beforeAll(async () => {
		depositor = await fundedActor(7, BIG_BALANCE);
		const atomIds = [
			await createAtom(ctx, 'dynamic-fee triple subject'),
			await createAtom(ctx, 'dynamic-fee triple predicate'),
			await createAtom(ctx, 'dynamic-fee triple object'),
		] as const;
		const tripleCost = await multiVaultGetTripleCost(ctx.multiVault);
		const assets = tripleCost + 2n * TRUST;
		const tripleId = await multiVaultCalculateTripleId(ctx.multiVault, { args: [...atomIds] });
		await waitForSuccess(
			await multiVaultCreateTriples(
				{ address: ctx.multiVault.address, walletClient, publicClient },
				{ args: [[atomIds[0]], [atomIds[1]], [atomIds[2]], [assets]], value: assets }
			)
		);
		run = await runDeposit(ctx, depositor, tripleId, 3_000n * TRUST, { triple: { atomIds } });
		const counterId = await multiVaultGetCounterIdFromTripleId(ctx.multiVault, {
			args: [tripleId],
		});
		counterVault = multiVaultResolveVaultTotals(
			await multiVaultGetVault(ctx.multiVault, { args: [counterId, ctx.curveId] })
		);
	}, 300_000);

	it('previewDeposit == composed quote (doubled bootstrap, atom-deposit fraction) == minted shares', () => {
		expect(run.composed.isNewVault).toBe(true);
		expect(run.composed.termFee).toBeGreaterThan(0n);
		expect(run.preview.shares).toBe(run.composed.shares);
		expect(run.preview.assetsAfterFees).toBe(run.composed.assetsAfterFees);
		expect(run.actorAfter.shares - run.actorBefore.shares).toBe(run.preview.shares);
	});

	it('curve fee and its distribution equal the replica', () => {
		expect(run.composed.curveFee).toBe(run.onchainQuoteFee);
		expect(run.recorded.fee).toBe(run.onchainQuoteFee);
		expect(run.bandEvents).toEqual(run.replica.bands);
		expect(run.after.tierStake).toEqual(
			denseByTier(run.replica.occupancyAfter, ctx.config.tierCount)
		);
		expect(run.after.accFeePerShare).toEqual(
			denseByTier(run.replica.accFeePerShareAfter, ctx.config.tierCount)
		);
		expect(run.after.protocolAccrued - run.before.protocolAccrued).toBe(run.replica.toProtocol);
		expect(run.balancesAfter.curve - run.balancesBefore.curve).toBe(run.onchainQuoteFee);
	});

	it('seeds the counter-triple vault on the same curve with the min share, at par', () => {
		expect(counterVault.totalShares).toBe(ctx.minShare);
		expect(counterVault.totalAssets).toBe(ctx.minShare);
	});
});

/* ============================== misc reads ============================== */

describe('claim surface', () => {
	it('claimableAcross rejects a repeated term, and claim([]) on an empty balance reverts NothingToClaim', async () => {
		const nobody = await fundedActor(2, BIG_BALANCE);
		const termId = toHex('dynamic-fee duplicate term', { size: 32 }) as Hex;
		await expect(
			dynamicFeeFlatPriceCurveClaimableAcross(ctx.curve, {
				args: [nobody.address, [termId, termId]],
			})
		).rejects.toThrow(/DuplicateTermIds/);
		expect(
			await dynamicFeeFlatPriceCurveClaimableAcross(ctx.curve, { args: [nobody.address, []] })
		).toBe(0n);
		await expect(
			dynamicFeeFlatPriceCurveClaim(
				{ address: ctx.curveAddress, walletClient: nobody.wallet, publicClient },
				{ args: [[]] }
			)
		).rejects.toThrow(/NothingToClaim/);
	});

	it('a holder with no lot is quoted at the vault tier, by quoteRedeemFee and previewRedeemFor alike', async () => {
		const stranger = '0x000000000000000000000000000000000000dEaD' as Address;
		const termId = await createAtom(ctx, 'dynamic-fee no-lot quote');
		const seed = await fundedActor(8, BIG_BALANCE);
		await runDeposit(ctx, seed, termId, 3_000n * TRUST);
		const vaultStake = (await readCurve(ctx, termId)).vaultStake;
		const shares = 123n * TRUST;
		const vaultTier = dynamicFeeTierOf(vaultStake, ctx.config);
		const expected = dynamicFeeQuoteRedeemFee(shares, vaultTier, ctx.config);
		const [forStranger, forZero] = await Promise.all([
			publicClient.readContract({
				address: ctx.curveAddress,
				abi: DynamicFeeFlatPriceCurveAbi,
				functionName: 'quoteRedeemFee',
				args: [termId, stranger, shares],
			}),
			publicClient.readContract({
				address: ctx.curveAddress,
				abi: DynamicFeeFlatPriceCurveAbi,
				functionName: 'quoteRedeemFee',
				args: [termId, zeroAddress, shares],
			}),
		]);
		expect(forStranger).toBe(expected);
		expect(forZero).toBe(expected);
	});
});

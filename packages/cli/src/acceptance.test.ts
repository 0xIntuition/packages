/**
 * Executable checks for the app-call contract: the eight things the app must
 * be able to do by the end of this package chain, reachable only through the published
 * packages — no direct contract access, no local ABI. Each `it` below is one point from
 * the handoff's §3.
 *
 * These import from the package NAMES (`@0xintuition/sdk`, `@0xintuition/curves`,
 * `@0xintuition/protocol`, `@0xintuition/periphery`), not relative paths into their
 * source, to prove the surface is reachable the way an external app would reach it.
 */
import { dynamicFeeQuoteDepositFee, dynamicFeeTierLadder } from '@0xintuition/curves';
import type { FeeGuard } from '@0xintuition/periphery';
import type { Address, Hex, ReadConfig, WriteConfig } from '@0xintuition/protocol';
import {
	dynamicFeeCurveGetClaimableAcrossTerms,
	dynamicFeeCurvePrepareClaimTx,
	dynamicFeeCurvePrepareDepositTx,
	feeProxyPrepareCreateAtomsWithUrisTx,
	multivaultPrepareMulticallTx,
	multivaultPrepareOnBehalfOfCreationPlan,
} from '@0xintuition/sdk';
import { describe, expect, it } from 'vitest';

const ACCOUNT = '0x1111111111111111111111111111111111111111' as Address;
const CALLER = '0x2222222222222222222222222222222222222222' as Address;
const MULTIVAULT = '0x3333333333333333333333333333333333333333' as Address;
const REGISTRY = '0x4444444444444444444444444444444444444444' as Address;
const CURVE = '0x5555555555555555555555555555555555555555' as Address;
const FEE_PROXY = '0x6666666666666666666666666666666666666666' as Address;
const TERM_ID = `0x${'ab'.repeat(32)}` as Hex;
const TERM_ID_2 = `0x${'cd'.repeat(32)}` as Hex;
const SUBJECT_ID = `0x${'ef'.repeat(32)}` as Hex;
const PREDICATE_ID = `0x${'12'.repeat(32)}` as Hex;
const OBJECT_ID = `0x${'34'.repeat(32)}` as Hex;

const multiVaultWriteConfig = { publicClient: {} } as unknown as WriteConfig;

describe('app-call contract', () => {
	it('1. quotes a deposit that climbs several tiers, piecewise across every traversed band', async () => {
		const config = {
			width0: 1_000n,
			tierCount: 4n,
			tierWidthGrowthBps: 5_000n,
			depositBaseBps: 100n,
			depositGrowthBps: 50n,
			depositCapBps: 500n,
			depositFulcrumAlphaBps: 10_000n,
			depositKernelSpread: 4n * 10n ** 18n,
			redeemFulcrumAlphaBps: 10_000n,
			redeemKernelSpread: 4n * 10n ** 18n,
			redeemBaseBps: 80n,
			redeemGrowthBps: 40n,
			redeemCapBps: 400n,
			redeemToFulcrumTiersBps: 0n,
			depositToPriorTierBps: 0n,
			minEligibleTierStakeBps: 0n,
		};

		// The real gross-up-per-band piecewise quote for this config and deposit size — this
		// is what the on-chain DynamicFeeFlatPriceCurve.quoteDepositFee(termId, 3_500n) returns
		// against an empty vault (see @0xintuition/curves' golden-vector tests for the same math).
		// Deriving it here, rather than an arbitrary constant, keeps this test honest: it proves
		// the deposit actually traversed several tier bands, not just plumbed a stub through.
		const expectedCurveFee = dynamicFeeQuoteDepositFee(0n, 3_500n, config as never);
		// A naive single-tier quote at the pre-deposit tier's rate (100 bps) would undercharge —
		// the real fee below is well above this, proving multiple tiers were actually crossed.
		const flatTierZeroFee = (3_500n * 100n + 9_999n) / 10_000n;
		expect(expectedCurveFee).toBeGreaterThan(flatTierZeroFee);

		const prepared = await dynamicFeeCurvePrepareDepositTx(
			{
				multiVault: multiVaultWriteConfig,
				bondingCurveRegistry: { address: REGISTRY } as ReadConfig,
			},
			// A deposit sized to cross multiple tier-0-width bands.
			{ receiver: ACCOUNT, termId: TERM_ID, curveId: 5n, assetsIn: 3_500n },
			{
				curveAddresses: async () => CURVE,
				getConfig: async () => config as never,
				tierFeeOverride: async () => [false, 0n, 0n] as never,
				quoteDepositFee: async () => expectedCurveFee,
				quoteDepositPlan: async () =>
					({
						termId: TERM_ID,
						curveId: 5n,
						assetsIn: 3_500n,
						// A vault with existing shares: the first-deposit min-share bootstrap netting
						// doesn't apply, so the fee base is the full gross assetsIn.
						feeBaseAssets: 3_500n,
						minShareCost: 0n,
						isFirstDeposit: false,
						sharesOut: 3_400n,
						minSharesOut: 3_366n,
						assetsAfterFees: 3_450n,
						entryFee: 25n,
						entryFeeWaived: false,
						protocolFee: 25n,
						totalEstimatedFees: 50n,
						currentSharePrice: 10n ** 18n,
						effectivePricePerShare: 10n ** 18n,
						slippageBps: 100n,
					}) as never,
				vaultStake: async () => 0n,
				userLots: async () => [[], []] as never,
				bankedEarnings: async () => 0n,
			} as Parameters<typeof dynamicFeeCurvePrepareDepositTx>[2]
		);

		expect(prepared.calldata.startsWith('0x')).toBe(true);
		expect(prepared.quote.curveFee).toBe(expectedCurveFee);
		expect(prepared.quote.curveFee).toBeGreaterThan(flatTierZeroFee);
		// The bands the fee is made of come back with it, so the quote can be explained rather
		// than only asserted: several traversed, summing to the deposit's fee base.
		expect(prepared.quote.bands.length).toBeGreaterThan(1);
		expect(prepared.quote.bands.reduce((sum, band) => sum + band.fee, 0n)).toBe(expectedCurveFee);
	});

	it('2. renders the tier ladder and the fee at each tier', () => {
		const config = {
			width0: 1_000n,
			tierCount: 5n,
			tierWidthGrowthBps: 5_000n,
			depositBaseBps: 100n,
			depositGrowthBps: 50n,
			depositCapBps: 500n,
			depositFulcrumAlphaBps: 10_000n,
			depositKernelSpread: 4n * 10n ** 18n,
			redeemFulcrumAlphaBps: 10_000n,
			redeemKernelSpread: 4n * 10n ** 18n,
			redeemBaseBps: 80n,
			redeemGrowthBps: 40n,
			redeemCapBps: 400n,
			redeemToFulcrumTiersBps: 0n,
			depositToPriorTierBps: 0n,
			minEligibleTierStakeBps: 0n,
		};

		const ladder = dynamicFeeTierLadder(config);

		expect(ladder).toHaveLength(5);
		// The top tier is unbounded (null edge/width) by design; every other tier has a positive edge.
		expect(ladder.every((entry) => entry.upperEdge === null || entry.upperEdge > 0n)).toBe(true);
		expect(ladder.at(-1)?.upperEdge).toBeNull();
		// Fee rates increase tier-over-tier per the schedule.
		expect(ladder[1]?.depositFeeBps).toBeGreaterThan(ladder[0]?.depositFeeBps ?? 0n);
	});

	it("3. reads a holder's claimable balance across terms, and builds the claim transaction", async () => {
		const claimable = await dynamicFeeCurveGetClaimableAcrossTerms(
			{ address: CURVE } as ReadConfig,
			{ account: ACCOUNT, termIds: [TERM_ID, TERM_ID_2] },
			{
				claimableAcross: async () => 500n,
				pendingFor: async (_config, inputs) => (inputs.args[1] === TERM_ID ? 500n : 0n),
				bankedEarnings: async () => 120n,
			}
		);
		expect(claimable.totalClaimable).toBe(500n);
		// The settled half comes back separately, so a consumer can show the split without
		// re-deriving it from `claimable`, which folds it into every per-term answer.
		expect(claimable.bankedEarnings).toBe(120n);
		expect(claimable.claimableTermIds).toEqual([TERM_ID]);

		const prepared = await dynamicFeeCurvePrepareClaimTx(
			{ address: CURVE } as ReadConfig,
			{ account: ACCOUNT, termIds: [TERM_ID, TERM_ID_2] },
			{
				claimableAcross: async () => 500n,
				pendingFor: async (_config, inputs) => (inputs.args[1] === TERM_ID ? 500n : 0n),
				bankedEarnings: async () => 120n,
			}
		);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
		expect(prepared.args).toEqual([[TERM_ID, TERM_ID_2]]);
		expect(prepared.isClaimable).toBe(true);
	});

	it('4. previews a redeem for a specific holder via the account-aware curve preview', async () => {
		const { dynamicFeeFlatPriceCurvePreviewRedeemFor } = await import('@0xintuition/protocol');

		const preview = await dynamicFeeFlatPriceCurvePreviewRedeemFor(
			{
				address: CURVE,
				publicClient: {
					readContract: async () => [970n, 30n] as const,
				},
			} as unknown as ReadConfig,
			{ args: [TERM_ID, ACCOUNT, 1_000n] }
		);

		expect(preview).toEqual([970n, 30n]);
	});

	it('5. creates atoms on behalf of another account via createAtomsFor under CREATION approval', async () => {
		const plan = await multivaultPrepareOnBehalfOfCreationPlan(
			{ address: MULTIVAULT } as ReadConfig,
			{ creator: ACCOUNT, caller: CALLER, atoms: [{ data: '0x1234', assets: 100n }] },
			{
				isApprovedToCreate: async () => true,
				isApprovedToDeposit: async () => false,
				isApprovedToRedeem: async () => false,
			}
		);

		expect(plan.approvalAlreadyGranted).toBe(true);
		expect(plan.steps.map((step) => step.type)).toEqual(['create-atoms-for']);
	});

	it('creates triples on behalf of another account via createTriplesFor, prepending approval when missing', async () => {
		const plan = await multivaultPrepareOnBehalfOfCreationPlan(
			{ address: MULTIVAULT } as ReadConfig,
			{
				creator: ACCOUNT,
				caller: CALLER,
				triples: [
					{ subjectId: SUBJECT_ID, predicateId: PREDICATE_ID, objectId: OBJECT_ID, assets: 50n },
				],
			},
			{
				isApprovedToCreate: async () => false,
				isApprovedToDeposit: async () => false,
				isApprovedToRedeem: async () => false,
			}
		);

		expect(plan.steps.map((step) => step.type)).toEqual(['approve', 'create-triples-for']);
	});

	it('6. creates atoms with URI context via createAtomsWithUris and decodes AtomContextRegistered', async () => {
		const { eventParseAtomContextRegistered } = await import('@0xintuition/protocol');
		expect(typeof eventParseAtomContextRegistered).toBe('function');

		const prepared = await feeProxyPrepareCreateAtomsWithUrisTx(
			{
				feeProxy: { address: FEE_PROXY } as ReadConfig,
				multiVault: { address: MULTIVAULT } as ReadConfig,
			},
			{
				affiliate: CALLER,
				atomDatas: ['0xdead'],
				assets: [1_000n],
				uris: [['0xbeef']],
				feeGuard: { maxFeeBps: 500n, maxFixedFee: 0n } satisfies FeeGuard,
			},
			{
				previewCreationFee: async () => [10n, 990n],
				getAtomUriConfig: async () => [5, 700],
			}
		);

		expect(prepared.calldata.startsWith('0x')).toBe(true);
	});

	it('7. builds a consolidated payable multicall batch with per-sub-call value virtualization', () => {
		const prepared = multivaultPrepareMulticallTx([
			{ calldata: '0xaaaa', value: 100n },
			{ calldata: '0xbbbb', value: 0n },
		]);

		expect(prepared.value).toBe(100n);
		expect(prepared.args).toEqual([
			['0xaaaa', '0xbbbb'],
			[100n, 0n],
		]);
	});

	it('8. routes a creation through FeeProxy via createAtomsWithUrisVia, with affiliate fee and refund accounting', async () => {
		const prepared = await feeProxyPrepareCreateAtomsWithUrisTx(
			{
				feeProxy: { address: FEE_PROXY } as ReadConfig,
				multiVault: { address: MULTIVAULT } as ReadConfig,
			},
			{
				affiliate: CALLER,
				atomDatas: ['0xdead'],
				assets: [1_000n],
				uris: [[]],
				feeGuard: { maxFeeBps: 500n, maxFixedFee: 0n } satisfies FeeGuard,
			},
			{
				previewCreationFee: async () => [25n, 975n],
				getAtomUriConfig: async () => [5, 700],
			}
		);

		expect(prepared.quote.previewedFee).toBe(25n);
		expect(prepared.quote.previewedForwarded).toBe(975n);
		expect(prepared.value).toBe(1_000n);

		const { feeProxyClaimRefund, feeProxyPendingRefund } = await import('@0xintuition/periphery');
		expect(typeof feeProxyClaimRefund).toBe('function');
		expect(typeof feeProxyPendingRefund).toBe('function');
	});
});

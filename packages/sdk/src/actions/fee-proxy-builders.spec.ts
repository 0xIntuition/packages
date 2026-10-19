import { FeeProxyAbi, feeProxyAllocate, feeProxyCalcFee } from '@0xintuition/periphery';
import { MultiVaultAbi, type ReadConfig } from '@0xintuition/protocol';
import {
	type Address,
	decodeFunctionData,
	type Hex,
	type PublicClient,
	type WalletClient,
} from 'viem';
import { describe, expect, it, vi } from 'vitest';

import {
	feeProxyBuildCreateViaPlan,
	feeProxyBuildDepositViaPlan,
	feeProxyExecutePlan,
	feeProxyGetReadiness,
	feeProxyQuoteDepositVia,
} from './fee-proxy-builders';

const FEE_PROXY = '0x2222222222222222222222222222222222222222' as Address;
const MULTIVAULT = '0x3333333333333333333333333333333333333333' as Address;
const AFFILIATE = '0x1111111111111111111111111111111111111111' as Address;
const USER = '0x4444444444444444444444444444444444444444' as Address;
const RECEIVER = '0x5555555555555555555555555555555555555555' as Address;
const TERM_A = `0x${'aa'.repeat(32)}` as Hex;
const TERM_B = `0x${'bb'.repeat(32)}` as Hex;
const TERM_C = `0x${'cc'.repeat(32)}` as Hex;
const TRUST = 10n ** 18n;

const configs = {
	feeProxy: { address: FEE_PROXY } as ReadConfig,
	multiVault: { address: MULTIVAULT } as ReadConfig,
};

const FEES = {
	depositBps: 100n,
	creationBps: 250n,
	depositFixedFee: TRUST / 1_000n,
	creationFixedFee: TRUST / 100n,
};

type Approvals = Record<string, number>;

/** In-memory FeeProxy + MultiVault reads, computed from the same formulas the contracts use. */
function fakeDeps(
	options: {
		approvals?: Approvals;
		paused?: boolean;
		registered?: boolean;
		affiliatePaused?: boolean;
		fees?: typeof FEES;
		maxFeeBps?: bigint;
		maxFixedFee?: bigint;
		pendingRefund?: bigint;
		minDeposit?: bigint;
		atomCost?: bigint;
		tripleCost?: bigint;
		feeSkew?: bigint;
		creationFloor?: bigint;
		/**
		 * A deposit base (assets above the creation cost) MultiVault cannot take: its fees, each rounded
		 * up, exceed it and the create underflows. Mirrors a 1 wei base on mainnet fees.
		 */
		underflowBase?: bigint;
		/** What FeeProxy's own `multiVault()` returns; defaults to `configs.multiVault`. */
		feeProxyMultiVault?: Address;
	} = {}
) {
	const fees = options.fees ?? FEES;
	const approvals = options.approvals ?? {};
	const bits = (spender: Address, granter: Address) =>
		approvals[`${granter.toLowerCase()}:${spender.toLowerCase()}`] ?? 0;
	const skew = options.feeSkew ?? 0n;
	const preview = (gross: bigint, bps: bigint, fixedFee: bigint) => {
		const fee = feeProxyCalcFee(gross, bps, fixedFee) + skew;
		return [fee, fee >= gross ? 0n : gross - fee] as const;
	};

	return {
		multiVault: vi.fn(async () => options.feeProxyMultiVault ?? MULTIVAULT),
		paused: vi.fn(async () => options.paused ?? false),
		affiliateConfig: vi.fn(async () => ({
			fees,
			feeRecipient: AFFILIATE,
			registeredAt: options.registered === false ? 0n : 1_700_000_000n,
			paused: options.affiliatePaused ?? false,
		})),
		maxFeeBps: vi.fn(async () => options.maxFeeBps ?? 1_000n),
		maxFixedFee: vi.fn(async () => options.maxFixedFee ?? TRUST),
		pendingRefund: vi.fn(async () => options.pendingRefund ?? 0n),
		isApprovedToDeposit: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Address, Address] }) =>
				(bits(args[0], args[1]) & 1) !== 0
		),
		isApprovedToRedeem: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Address, Address] }) =>
				(bits(args[0], args[1]) & 2) !== 0
		),
		isApprovedToCreate: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Address, Address] }) =>
				(bits(args[0], args[1]) & 4) !== 0
		),
		previewDepositFee: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Address, bigint] }) =>
				preview(args[1], fees.depositBps, fees.depositFixedFee)
		),
		previewCreationFee: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Address, bigint] }) =>
				preview(args[1], fees.creationBps, fees.creationFixedFee)
		),
		// 1 share per 2 wei forwarded, so expected shares are easy to state.
		previewDeposit: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Hex, bigint, bigint] }) =>
				[args[2] / 2n, args[2]] as const
		),
		getGeneralConfig: vi.fn(async () => ({
			admin: USER,
			protocolMultisig: USER,
			feeDenominator: 10_000n,
			trustBonding: USER,
			minDeposit: options.minDeposit ?? 0n,
			minShare: 1_000n,
			atomDataMaxLength: 1_000n,
			feeThreshold: 0n,
		})),
		getAtomCost: vi.fn(async () => options.atomCost ?? TRUST / 10n + 1_000n),
		getTripleCost: vi.fn(async () => options.tripleCost ?? TRUST / 10n + 2_000n),
		getAtomUriConfig: vi.fn(async () => [5, 700] as const),
		calculateAtomId: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Hex] }) =>
				`0x${args[0].slice(2).padStart(64, '0')}` as Hex
		),
		calculateTripleId: vi.fn(async () => `0x${'dd'.repeat(32)}` as Hex),
		// Mimics MultiVault rejecting a leg below its creation floor, else 1 share per 3 wei.
		previewAtomCreate: vi.fn(async (_c: ReadConfig, { args }: { args: readonly [Hex, bigint] }) => {
			if (args[1] < (options.creationFloor ?? 0n)) {
				throw new Error('MultiVault_InsufficientAssets');
			}
			if (
				options.underflowBase !== undefined &&
				args[1] - (options.atomCost ?? TRUST / 10n + 1_000n) === options.underflowBase
			) {
				throw new Error('panic: arithmetic underflow or overflow (0x11)');
			}
			return [args[1] / 3n, 0n, args[1]] as const;
		}),
		previewTripleCreate: vi.fn(
			async (_c: ReadConfig, { args }: { args: readonly [Hex, Hex, Hex, bigint] }) =>
				[args[3] / 5n, 0n, args[3]] as const
		),
	};
}

const asDeps = <T>(deps: ReturnType<typeof fakeDeps>) => deps as unknown as T;

function decodeApprove(data: Hex) {
	const decoded = decodeFunctionData({ abi: MultiVaultAbi, data });
	expect(decoded.functionName).toBe('approve');
	return decoded.args as readonly [Address, number];
}

describe('feeProxyGetReadiness', () => {
	it('is ready with no steps when every check passes', async () => {
		const deps = fakeDeps({
			approvals: { [`${USER.toLowerCase()}:${FEE_PROXY.toLowerCase()}`]: 5 },
			pendingRefund: 3n,
		});
		const readiness = await feeProxyGetReadiness(
			configs,
			{ user: USER, affiliate: AFFILIATE, kinds: ['deposit', 'create'] },
			asDeps(deps)
		);
		expect(readiness.ready).toBe(true);
		expect(readiness.missing).toEqual([]);
		expect(readiness.approvalSteps).toEqual([]);
		expect(readiness.pendingRefund).toBe(3n);
		// The proxy approval is read on (spender = FeeProxy, receiver = user), as the contract checks it.
		expect(deps.isApprovedToDeposit).toHaveBeenCalledWith(configs.multiVault, {
			args: [FEE_PROXY, USER],
		});
	});

	it('merges DEPOSIT and CREATION for the same pair into ONE approve that keeps existing bits', async () => {
		const deps = fakeDeps({
			approvals: { [`${USER.toLowerCase()}:${FEE_PROXY.toLowerCase()}`]: 2 },
		});
		const readiness = await feeProxyGetReadiness(
			configs,
			{ user: USER, affiliate: AFFILIATE, kinds: ['deposit', 'create'] },
			asDeps(deps)
		);
		expect(readiness.ready).toBe(false);
		expect(readiness.missing.map((issue) => issue.code)).toEqual([
			'receiver-has-not-approved-proxy-for-deposit',
			'caller-has-not-approved-proxy-for-creation',
		]);
		expect(readiness.approvalSteps).toHaveLength(1);
		const [step] = readiness.approvalSteps;
		expect(step?.from).toBe(USER);
		expect(step?.to).toBe(MULTIVAULT);
		expect(step?.value).toBe(0n);
		// REDEMPTION (2) kept, DEPOSIT (1) and CREATION (4) added: ALL (7).
		expect(decodeApprove(step?.data ?? '0x')).toEqual([FEE_PROXY, 7]);
	});

	it('a delegated deposit needs two approvals, both signed by the receiver', async () => {
		const deps = fakeDeps();
		const readiness = await feeProxyGetReadiness(
			configs,
			{ user: USER, affiliate: AFFILIATE, receiver: RECEIVER, kinds: ['deposit'] },
			asDeps(deps)
		);
		expect(readiness.missing.map((issue) => issue.code)).toEqual([
			'receiver-has-not-approved-proxy-for-deposit',
			'receiver-has-not-approved-caller-for-deposit',
		]);
		expect(readiness.approvalSteps.map((step) => step.from)).toEqual([RECEIVER, RECEIVER]);
		expect(readiness.approvalSteps.map((step) => decodeApprove(step.data))).toEqual([
			[FEE_PROXY, 1],
			[USER, 1],
		]);
	});

	it('reports the blockers no approval can fix', async () => {
		const paused = await feeProxyGetReadiness(
			configs,
			{ user: USER, affiliate: AFFILIATE, kinds: ['deposit'] },
			asDeps(fakeDeps({ paused: true, affiliatePaused: true }))
		);
		expect(paused.missing.filter((issue) => !issue.fixable).map((issue) => issue.code)).toEqual([
			'proxy-paused',
			'affiliate-paused',
		]);

		const unregistered = await feeProxyGetReadiness(
			configs,
			{ user: USER, affiliate: AFFILIATE, kinds: ['create'] },
			asDeps(fakeDeps({ registered: false }))
		);
		expect(unregistered.missing[0]?.code).toBe('affiliate-not-registered');

		// A lowered cap blocks only the side that is over it.
		const overCap = await feeProxyGetReadiness(
			configs,
			{ user: USER, affiliate: AFFILIATE, kinds: ['deposit', 'create'] },
			asDeps(fakeDeps({ maxFeeBps: 200n }))
		);
		expect(overCap.missing.filter((issue) => !issue.fixable).map((issue) => issue.code)).toEqual([
			'creation-fees-over-cap',
		]);
	});
});

describe('feeProxyQuoteDepositVia', () => {
	it('single deposit: fee, forwarded, shares, minShares, value and pinned guard', async () => {
		const deps = fakeDeps();
		const gross = 3n * TRUST + 17n;
		const quote = await feeProxyQuoteDepositVia(
			configs,
			{
				affiliate: AFFILIATE,
				deposits: [{ termId: TERM_A, curveId: 1n, grossAssets: gross }],
				slippageBps: 50n,
			},
			asDeps(deps)
		);
		const fee = (gross * FEES.depositBps) / 10_000n + FEES.depositFixedFee;
		expect(quote.method).toBe('depositVia');
		expect(quote.affiliateFee).toBe(fee);
		expect(quote.totalForwardedAssets).toBe(gross - fee);
		expect(quote.value).toBe(gross);
		expect(quote.legs[0]?.forwardedAssets).toBe(gross - fee);
		expect(quote.legs[0]?.expectedShares).toBe((gross - fee) / 2n);
		expect(quote.legs[0]?.minShares).toBe((((gross - fee) / 2n) * 9_950n) / 10_000n);
		expect(quote.feeGuard).toEqual({
			maxFeeBps: FEES.depositBps,
			maxFixedFee: FEES.depositFixedFee,
		});
	});

	it('batch: one fee on the total, split with FeeProxy _allocate', async () => {
		const deps = fakeDeps();
		const grossAssets = [TRUST + 1n, 2n * TRUST + 3n, 7n];
		const quote = await feeProxyQuoteDepositVia(
			configs,
			{
				affiliate: AFFILIATE,
				deposits: [
					{ termId: TERM_A, curveId: 1n, grossAssets: grossAssets[0]! },
					{ termId: TERM_B, curveId: 1n, grossAssets: grossAssets[1]! },
					{ termId: TERM_A, curveId: 2n, grossAssets: grossAssets[2]! },
				],
			},
			asDeps(deps)
		);
		const total = grossAssets.reduce((sum, value) => sum + value, 0n);
		const fee = feeProxyCalcFee(total, FEES.depositBps, FEES.depositFixedFee);
		expect(quote.method).toBe('depositBatchVia');
		expect(quote.affiliateFee).toBe(fee);
		expect(quote.legs.map((leg) => leg.forwardedAssets)).toEqual(
			feeProxyAllocate(grossAssets, total - fee)
		);
		expect(deps.previewDepositFee).toHaveBeenCalledTimes(1);
	});

	it('a fee cut before inclusion cannot push a batch leg under its minShares at 0 slippage', async () => {
		const fees = { ...FEES, depositBps: 0n, depositFixedFee: 1n };
		const deps = fakeDeps({ fees });
		// Quoted forwarded [1, 1, 2]; with the fixed fee cut to 0 the split becomes [2, 2, 1], so the
		// last leg lands one wei under its quoted forwarded amount.
		const grossAssets = [2n, 2n, 1n];
		const quote = await feeProxyQuoteDepositVia(
			configs,
			{
				affiliate: AFFILIATE,
				deposits: [
					{ termId: TERM_A, curveId: 1n, grossAssets: 2n },
					{ termId: TERM_B, curveId: 1n, grossAssets: 2n },
					{ termId: TERM_C, curveId: 1n, grossAssets: 1n },
				],
				slippageBps: 0n,
			},
			asDeps(deps)
		);
		expect(quote.legs.map((leg) => leg.forwardedAssets)).toEqual([1n, 1n, 2n]);
		expect(quote.legs.map((leg) => leg.minForwardedAssets)).toEqual([1n, 1n, 1n]);

		// Every lower fee forwards a total in [F, G]; check every leg at each of them.
		for (
			let forwarded = quote.totalForwardedAssets;
			forwarded <= quote.totalGrossAssets;
			forwarded += 1n
		) {
			for (const [index, legForwarded] of feeProxyAllocate(grossAssets, forwarded).entries()) {
				const leg = quote.legs[index];
				expect(legForwarded >= (leg?.minForwardedAssets ?? 0n)).toBe(true);
				// The fake MultiVault mints one share per 2 wei.
				expect(legForwarded / 2n >= (leg?.minShares ?? 0n)).toBe(true);
			}
		}
	});

	it('a fee cut keeps every leg at or above minShares at realistic sizes too', async () => {
		const deps = fakeDeps();
		const grossAssets = [TRUST + 1n, 2n * TRUST + 3n, 7n * TRUST + 5n];
		const quote = await feeProxyQuoteDepositVia(
			configs,
			{
				affiliate: AFFILIATE,
				deposits: grossAssets.map((grossAssets, index) => ({
					termId: [TERM_A, TERM_B, TERM_C][index] ?? TERM_A,
					curveId: 1n,
					grossAssets,
				})),
				slippageBps: 0n,
			},
			asDeps(deps)
		);
		const lowerFees: [bigint, bigint][] = [
			[0n, 0n],
			[FEES.depositBps, 0n],
			[0n, FEES.depositFixedFee],
			[FEES.depositBps - 1n, FEES.depositFixedFee],
			[FEES.depositBps, FEES.depositFixedFee - 1n],
		];
		for (const [bps, fixedFee] of lowerFees) {
			const forwarded =
				quote.totalGrossAssets - feeProxyCalcFee(quote.totalGrossAssets, bps, fixedFee);
			for (const [index, legForwarded] of feeProxyAllocate(grossAssets, forwarded).entries()) {
				expect(legForwarded / 2n >= (quote.legs[index]?.minShares ?? 0n)).toBe(true);
			}
		}
	});

	it('refuses to quote when the on-chain preview disagrees with the fee row', async () => {
		await expect(
			feeProxyQuoteDepositVia(
				configs,
				{
					affiliate: AFFILIATE,
					deposits: [{ termId: TERM_A, curveId: 1n, grossAssets: TRUST }],
				},
				asDeps(fakeDeps({ feeSkew: 1n }))
			)
		).rejects.toThrow(/disagrees/);
	});

	it('rejects a forwarded leg below minDeposit, duplicates, unregistered affiliates and bad slippage', async () => {
		const deposit = { termId: TERM_A, curveId: 1n, grossAssets: TRUST };
		await expect(
			feeProxyQuoteDepositVia(
				configs,
				{ affiliate: AFFILIATE, deposits: [deposit] },
				asDeps(fakeDeps({ minDeposit: TRUST }))
			)
		).rejects.toThrow(/minDeposit/);
		await expect(
			feeProxyQuoteDepositVia(
				configs,
				{ affiliate: AFFILIATE, deposits: [deposit, deposit] },
				asDeps(fakeDeps())
			)
		).rejects.toThrow(/appears twice/);
		await expect(
			feeProxyQuoteDepositVia(
				configs,
				{ affiliate: AFFILIATE, deposits: [deposit] },
				asDeps(fakeDeps({ registered: false }))
			)
		).rejects.toThrow(/not a registered affiliate/);
		await expect(
			feeProxyQuoteDepositVia(
				configs,
				{ affiliate: AFFILIATE, deposits: [deposit], slippageBps: 10_000n },
				asDeps(fakeDeps())
			)
		).rejects.toThrow(/slippageBps/);
	});
});

describe('feeProxyBuildDepositViaPlan', () => {
	it('orders the approval before the routed deposit and encodes value, minShares and guard', async () => {
		const deps = fakeDeps();
		const gross = 5n * TRUST;
		const plan = await feeProxyBuildDepositViaPlan(
			configs,
			{
				user: USER,
				affiliate: AFFILIATE,
				deposits: [{ termId: TERM_A, curveId: 1n, grossAssets: gross }],
			},
			asDeps(deps)
		);
		expect(plan.steps.map((step) => step.kind)).toEqual(['approve', 'deposit-via']);
		const route = plan.steps[1];
		expect(route?.from).toBe(USER);
		expect(route?.to).toBe(FEE_PROXY);
		expect(route?.value).toBe(gross);
		expect(plan.value).toBe(gross);
		const decoded = decodeFunctionData({ abi: FeeProxyAbi, data: route?.data ?? '0x' });
		expect(decoded.functionName).toBe('depositVia');
		expect(decoded.args).toEqual([
			AFFILIATE,
			USER,
			TERM_A,
			1n,
			gross,
			plan.quote.legs[0]?.minShares,
			plan.quote.feeGuard,
		]);
	});

	it('throws on blockers instead of building a plan that cannot land', async () => {
		await expect(
			feeProxyBuildDepositViaPlan(
				configs,
				{
					user: USER,
					affiliate: AFFILIATE,
					deposits: [{ termId: TERM_A, curveId: 1n, grossAssets: TRUST }],
				},
				asDeps(fakeDeps({ paused: true }))
			)
		).rejects.toThrow(/proxy-paused/);
	});

	it('a two-leg plan routes through depositBatchVia', async () => {
		const plan = await feeProxyBuildDepositViaPlan(
			configs,
			{
				user: USER,
				affiliate: AFFILIATE,
				deposits: [
					{ termId: TERM_A, curveId: 1n, grossAssets: TRUST },
					{ termId: TERM_B, curveId: 1n, grossAssets: 2n * TRUST },
				],
			},
			asDeps(fakeDeps({ approvals: { [`${USER.toLowerCase()}:${FEE_PROXY.toLowerCase()}`]: 1 } }))
		);
		expect(plan.steps.map((step) => step.kind)).toEqual(['deposit-batch-via']);
		const decoded = decodeFunctionData({ abi: FeeProxyAbi, data: plan.steps[0]?.data ?? '0x' });
		expect(decoded.functionName).toBe('depositBatchVia');
		expect(decoded.args?.[4]).toEqual([TRUST, 2n * TRUST]);
	});
});

describe('feeProxyBuildCreateViaPlan', () => {
	const approvedForCreation = {
		[`${USER.toLowerCase()}:${FEE_PROXY.toLowerCase()}`]: 4,
	};

	it('grosses each atom up so MultiVault receives at least cost + deposit per term, even after a fee cut', async () => {
		const deps = fakeDeps({ approvals: approvedForCreation });
		const atomCost = TRUST / 10n + 1_000n;
		const plan = await feeProxyBuildCreateViaPlan(
			configs,
			{
				user: USER,
				affiliate: AFFILIATE,
				atoms: [{ data: '0xaa' }, { data: '0xbb', deposit: 3n * TRUST + 1n }, { data: '0xcc' }],
				depositPerTerm: TRUST,
			},
			asDeps(deps)
		);
		const quote = plan.atoms;
		expect(quote?.method).toBe('createAtomsVia');
		const targets = [atomCost + TRUST, atomCost + 3n * TRUST + 1n, atomCost + TRUST];
		const grossAssets = quote?.grossAssets ?? [];
		// At the quoted fee and at any lower fee pair the FeeGuard lets through.
		for (const [bps, fixedFee] of [
			[FEES.creationBps, FEES.creationFixedFee],
			[0n, 0n],
			[FEES.creationBps, 0n],
			[0n, FEES.creationFixedFee],
		] as const) {
			const total = quote?.totalGrossAssets ?? 0n;
			const legs = feeProxyAllocate(grossAssets, total - feeProxyCalcFee(total, bps, fixedFee));
			expect(legs.every((leg, index) => leg >= (targets[index] ?? 0n))).toBe(true);
		}
		// One fixed fee for the whole call, and the total sits at most a few wei above the least gross
		// that forwards the targets' sum.
		expect(quote?.affiliateFee).toBe(
			feeProxyCalcFee(quote?.totalGrossAssets ?? 0n, FEES.creationBps, FEES.creationFixedFee)
		);
		const totalTarget = 3n * atomCost + 5n * TRUST + 1n;
		const forwards = (gross: bigint) =>
			gross - feeProxyCalcFee(gross, FEES.creationBps, FEES.creationFixedFee);
		const fourLess = (quote?.totalGrossAssets ?? 0n) - 4n;
		expect(forwards(fourLess) < totalTarget).toBe(true);
		expect(forwards(quote?.totalGrossAssets ?? 0n) >= totalTarget).toBe(true);

		expect(plan.steps.map((step) => step.kind)).toEqual(['create-atoms-via']);
		const decoded = decodeFunctionData({ abi: FeeProxyAbi, data: plan.steps[0]?.data ?? '0x' });
		expect(decoded.functionName).toBe('createAtomsVia');
		expect(decoded.args).toEqual([
			AFFILIATE,
			['0xaa', '0xbb', '0xcc'],
			quote?.grossAssets,
			{ maxFeeBps: FEES.creationBps, maxFixedFee: FEES.creationFixedFee },
		]);
		expect(plan.value).toBe(quote?.totalGrossAssets);
	});

	it('approval first, then atoms with URIs, then triples, each call paying its own fixed fee', async () => {
		const deps = fakeDeps();
		const plan = await feeProxyBuildCreateViaPlan(
			configs,
			{
				user: USER,
				affiliate: AFFILIATE,
				atoms: [{ data: '0xaa', uris: ['0x01'] }, { data: '0xbb' }],
				triples: [{ subjectId: TERM_A, predicateId: TERM_B, objectId: TERM_C }],
			},
			asDeps(deps)
		);
		expect(plan.steps.map((step) => step.kind)).toEqual([
			'approve',
			'create-atoms-with-uris-via',
			'create-triples-via',
		]);
		expect(decodeApprove(plan.steps[0]?.data ?? '0x')).toEqual([FEE_PROXY, 4]);
		const triples = plan.triples;
		expect(triples?.forwardedAssets).toEqual([TRUST / 10n + 2_000n]);
		expect(triples?.affiliateFee).toBeGreaterThanOrEqual(FEES.creationFixedFee);
		expect(plan.atoms?.affiliateFee).toBeGreaterThanOrEqual(FEES.creationFixedFee);
		expect(plan.value).toBe(
			(plan.atoms?.totalGrossAssets ?? 0n) + (triples?.totalGrossAssets ?? 0n)
		);
		const atomsCall = decodeFunctionData({ abi: FeeProxyAbi, data: plan.steps[1]?.data ?? '0x' });
		expect(atomsCall.functionName).toBe('createAtomsWithUrisVia');
		expect(atomsCall.args?.[3]).toEqual([['0x01'], []]);
	});

	it('reports term ids and previewed shares per leg, and names a leg MultiVault would reject', async () => {
		const plan = await feeProxyBuildCreateViaPlan(
			configs,
			{ user: USER, affiliate: AFFILIATE, atoms: [{ data: '0xaa' }], depositPerTerm: 9n },
			asDeps(fakeDeps({ approvals: approvedForCreation }))
		);
		expect(plan.atoms?.termIds).toEqual([`0x${'aa'.padStart(64, '0')}`]);
		expect(plan.atoms?.expectedShares).toEqual([(plan.atoms?.forwardedAssets[0] ?? 0n) / 3n]);

		await expect(
			feeProxyBuildCreateViaPlan(
				configs,
				{
					user: USER,
					affiliate: AFFILIATE,
					atoms: [
						{ data: '0xaa', deposit: TRUST },
						{ data: '0xbb', deposit: 1n },
						{ data: '0xcc', deposit: TRUST },
					],
				},
				asDeps(fakeDeps({ approvals: approvedForCreation, creationFloor: TRUST / 10n + 1_002n }))
			)
		).rejects.toThrow(/rejects atom 1/);
	});

	it('aims a leg one wei higher when the rounding margin would land it on a base MultiVault cannot take', async () => {
		// Zero deposits with a fixed fee: the margin used to put the last atom at cost + 1.
		const atomCost = 1_000n;
		const deps = fakeDeps({
			approvals: approvedForCreation,
			fees: { ...FEES, creationBps: 0n, creationFixedFee: 1n },
			atomCost,
			underflowBase: 1n,
		});
		const plan = await feeProxyBuildCreateViaPlan(
			configs,
			{ user: USER, affiliate: AFFILIATE, atoms: [{ data: '0xaa' }, { data: '0xbb' }] },
			asDeps(deps)
		);
		const forwarded = plan.atoms?.forwardedAssets ?? [];
		expect(forwarded).toHaveLength(2);
		expect(forwarded.every((assets) => assets >= atomCost && assets - atomCost !== 1n)).toBe(true);
		expect(plan.atoms?.deposits).toEqual([0n, 0n]);
		expect(plan.atoms?.expectedShares).toEqual(forwarded.map((assets) => assets / 3n));
	});

	it('still rejects a deposit the caller chose that MultiVault cannot take', async () => {
		await expect(
			feeProxyBuildCreateViaPlan(
				configs,
				{ user: USER, affiliate: AFFILIATE, atoms: [{ data: '0xaa', deposit: 1n }] },
				asDeps(
					fakeDeps({
						approvals: approvedForCreation,
						fees: { ...FEES, creationBps: 0n, creationFixedFee: 1n },
						atomCost: 1_000n,
						underflowBase: 1n,
					})
				)
			)
		).rejects.toThrow(/rejects atom 0/);
	});

	it('refuses to build when the on-chain creation preview disagrees with the local gross-up', async () => {
		await expect(
			feeProxyBuildCreateViaPlan(
				configs,
				{ user: USER, affiliate: AFFILIATE, atoms: [{ data: '0xaa' }] },
				asDeps(fakeDeps({ approvals: approvedForCreation, feeSkew: 1n }))
			)
		).rejects.toThrow(/disagrees/);
	});
});

describe("FeeProxy's MultiVault must be configs.multiVault", () => {
	const OTHER_MULTIVAULT = '0x6666666666666666666666666666666666666666' as Address;
	const approved = { [`${USER.toLowerCase()}:${FEE_PROXY.toLowerCase()}`]: 5 };
	const deposit = { termId: TERM_A, curveId: 1n, grossAssets: TRUST };
	const builders = [
		{
			name: 'feeProxyGetReadiness',
			run: (deps: ReturnType<typeof fakeDeps>) =>
				feeProxyGetReadiness(
					configs,
					{ user: USER, affiliate: AFFILIATE, kinds: ['deposit', 'create'] },
					asDeps(deps)
				),
		},
		{
			name: 'feeProxyQuoteDepositVia',
			run: (deps: ReturnType<typeof fakeDeps>) =>
				feeProxyQuoteDepositVia(
					configs,
					{ affiliate: AFFILIATE, deposits: [deposit] },
					asDeps(deps)
				),
		},
		{
			name: 'feeProxyBuildDepositViaPlan',
			run: (deps: ReturnType<typeof fakeDeps>) =>
				feeProxyBuildDepositViaPlan(
					configs,
					{ user: USER, affiliate: AFFILIATE, deposits: [deposit] },
					asDeps(deps)
				),
		},
		{
			name: 'feeProxyBuildCreateViaPlan',
			run: (deps: ReturnType<typeof fakeDeps>) =>
				feeProxyBuildCreateViaPlan(
					configs,
					{ user: USER, affiliate: AFFILIATE, atoms: [{ data: '0xaa' }] },
					asDeps(deps)
				),
		},
	] as const;

	for (const builder of builders) {
		it(`${builder.name} throws before any other read when FeeProxy forwards elsewhere`, async () => {
			const deps = fakeDeps({ approvals: approved, feeProxyMultiVault: OTHER_MULTIVAULT });
			await expect(builder.run(deps)).rejects.toThrow(
				`FeeProxy ${FEE_PROXY} forwards to MultiVault ${OTHER_MULTIVAULT}, not configs.multiVault ${MULTIVAULT}`
			);
			expect(deps.multiVault).toHaveBeenCalledWith(configs.feeProxy);
			expect(deps.affiliateConfig).not.toHaveBeenCalled();
		});

		it(`${builder.name} proceeds when the addresses match in any case, reading multiVault() once`, async () => {
			const deps = fakeDeps({
				approvals: approved,
				feeProxyMultiVault: MULTIVAULT.toUpperCase().replace('0X', '0x') as Address,
			});
			await expect(builder.run(deps)).resolves.toBeDefined();
			expect(deps.multiVault).toHaveBeenCalledTimes(1);
		});
	}
});

describe('feeProxyExecutePlan', () => {
	const step = (from: Address, kind: 'approve' | 'deposit-via') => ({
		kind,
		from,
		to: FEE_PROXY,
		data: '0x1234' as Hex,
		value: 5n,
		description: kind,
	});

	it('sends every step in order and waits for each receipt', async () => {
		const sendTransaction = vi
			.fn()
			.mockResolvedValueOnce(`0x${'01'.repeat(32)}`)
			.mockResolvedValueOnce(`0x${'02'.repeat(32)}`);
		const waitForTransactionReceipt = vi.fn(async ({ hash }: { hash: Hex }) => ({
			status: 'success',
			transactionHash: hash,
		}));
		const executed = await feeProxyExecutePlan(
			{
				walletClient: {
					account: { address: USER },
					chain: undefined,
					sendTransaction,
				} as unknown as WalletClient,
				publicClient: { waitForTransactionReceipt } as unknown as PublicClient,
			},
			{ steps: [step(USER, 'approve'), step(USER, 'deposit-via')] }
		);
		expect(executed.map((item) => item.step.kind)).toEqual(['approve', 'deposit-via']);
		expect(sendTransaction).toHaveBeenCalledTimes(2);
		expect(sendTransaction.mock.calls[0]?.[0]).toMatchObject({
			to: FEE_PROXY,
			data: '0x1234',
			value: 5n,
		});
	});

	it('sends nothing when any step needs another signer', async () => {
		const sendTransaction = vi.fn();
		await expect(
			feeProxyExecutePlan(
				{
					walletClient: {
						account: { address: USER },
						sendTransaction,
					} as unknown as WalletClient,
					publicClient: {} as PublicClient,
				},
				{ steps: [step(RECEIVER, 'approve'), step(USER, 'deposit-via')] }
			)
		).rejects.toThrow(/nothing was sent/);
		expect(sendTransaction).not.toHaveBeenCalled();
	});
});

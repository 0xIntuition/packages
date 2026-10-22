import {
	type FeeGuard,
	type FeeProxyGrossUp,
	feeProxyAffiliateConfig,
	feeProxyCreateAtomsViaEncode,
	feeProxyCreateTriplesViaEncode,
	feeProxyDepositBatchViaEncode,
	feeProxyDepositViaEncode,
	feeProxyGrossUpForTargets,
	feeProxyMaxFeeBps,
	feeProxyMaxFixedFee,
	feeProxyMultiVault,
	feeProxyPaused,
	feeProxyPendingRefund,
	feeProxyPreviewCreationFee,
	feeProxyPreviewDepositFee,
	feeProxySplitRouting,
} from '@0xintuition/periphery';
import {
	ApprovalTypes,
	multiVaultApproveEncode,
	multiVaultCalculateAtomId,
	multiVaultCalculateTripleId,
	multiVaultGetAtomCost,
	multiVaultGetAtomUriConfig,
	multiVaultGetGeneralConfig,
	multiVaultGetTripleCost,
	multiVaultIsApprovedToCreate,
	multiVaultIsApprovedToDeposit,
	multiVaultIsApprovedToRedeem,
	multiVaultPreviewAtomCreate,
	multiVaultPreviewDeposit,
	multiVaultPreviewTripleCreate,
	multiVaultResolveGeneralConfig,
	type ReadConfig,
} from '@0xintuition/protocol';
import {
	type Address,
	type Hex,
	isAddressEqual,
	type PublicClient,
	type TransactionReceipt,
	type WalletClient,
} from 'viem';

import { feeProxyPrepareCreateAtomsWithUrisTx } from './fee-proxy';

const BPS_DENOMINATOR = 10_000n;
const DEFAULT_SLIPPAGE_BPS = 100n;
/** How often a create plan re-aims a leg its rounding margin put on a base MultiVault rejects. */
const MAX_CREATE_MARGIN_RETRIES = 3;

type FeeProxyConfigs = { feeProxy: ReadConfig; multiVault: ReadConfig };

/** The two FeeProxy routing families, which need different MultiVault approvals. */
export type FeeProxyRouteKind = 'deposit' | 'create';

export type FeeProxyPlanStepKind =
	| 'approve'
	| 'deposit-via'
	| 'deposit-batch-via'
	| 'create-atoms-via'
	| 'create-atoms-with-uris-via'
	| 'create-triples-via';

/** One transaction in a FeeProxy plan, in send order. */
export type FeeProxyPlanStep = {
	kind: FeeProxyPlanStepKind;
	/** The account that must sign and send this step. Approval steps may need a different signer. */
	from: Address;
	to: Address;
	data: Hex;
	value: bigint;
	description: string;
};

export type FeeProxyReadinessIssueCode =
	| 'proxy-paused'
	| 'affiliate-not-registered'
	| 'affiliate-paused'
	| 'deposit-fees-over-cap'
	| 'creation-fees-over-cap'
	| 'receiver-has-not-approved-proxy-for-deposit'
	| 'receiver-has-not-approved-caller-for-deposit'
	| 'caller-has-not-approved-proxy-for-creation';

export type FeeProxyReadinessIssue = {
	code: FeeProxyReadinessIssueCode;
	message: string;
	/** True when one of the returned approval steps resolves it; false when only an admin or the affiliate can. */
	fixable: boolean;
};

export type FeeProxyReadiness = {
	ready: boolean;
	user: Address;
	affiliate: Address;
	receiver: Address;
	kinds: FeeProxyRouteKind[];
	missing: FeeProxyReadinessIssue[];
	/** Ready-to-send MultiVault `approve` transactions that clear every fixable issue. */
	approvalSteps: FeeProxyPlanStep[];
	/** The user's pull-fallback refund balance. Claim it with `feeProxyClaimRefundIfAny`. */
	pendingRefund: bigint;
};

type FeeProxyTargetDeps = {
	multiVault: typeof feeProxyMultiVault;
};

type FeeProxyReadinessDeps = FeeProxyTargetDeps & {
	paused: typeof feeProxyPaused;
	affiliateConfig: typeof feeProxyAffiliateConfig;
	maxFeeBps: typeof feeProxyMaxFeeBps;
	maxFixedFee: typeof feeProxyMaxFixedFee;
	pendingRefund: typeof feeProxyPendingRefund;
	isApprovedToDeposit: typeof multiVaultIsApprovedToDeposit;
	isApprovedToRedeem: typeof multiVaultIsApprovedToRedeem;
	isApprovedToCreate: typeof multiVaultIsApprovedToCreate;
};

type FeeProxyDepositQuoteDeps = FeeProxyTargetDeps & {
	affiliateConfig: typeof feeProxyAffiliateConfig;
	previewDepositFee: typeof feeProxyPreviewDepositFee;
	previewDeposit: typeof multiVaultPreviewDeposit;
	getGeneralConfig: typeof multiVaultGetGeneralConfig;
};

type FeeProxyCreatePlanDeps = FeeProxyReadinessDeps & {
	previewCreationFee: typeof feeProxyPreviewCreationFee;
	getAtomCost: typeof multiVaultGetAtomCost;
	getTripleCost: typeof multiVaultGetTripleCost;
	getAtomUriConfig: typeof multiVaultGetAtomUriConfig;
	calculateAtomId: typeof multiVaultCalculateAtomId;
	calculateTripleId: typeof multiVaultCalculateTripleId;
	previewAtomCreate: typeof multiVaultPreviewAtomCreate;
	previewTripleCreate: typeof multiVaultPreviewTripleCreate;
};

const defaultReadinessDeps: FeeProxyReadinessDeps = {
	multiVault: feeProxyMultiVault,
	paused: feeProxyPaused,
	affiliateConfig: feeProxyAffiliateConfig,
	maxFeeBps: feeProxyMaxFeeBps,
	maxFixedFee: feeProxyMaxFixedFee,
	pendingRefund: feeProxyPendingRefund,
	isApprovedToDeposit: multiVaultIsApprovedToDeposit,
	isApprovedToRedeem: multiVaultIsApprovedToRedeem,
	isApprovedToCreate: multiVaultIsApprovedToCreate,
};

const defaultDepositQuoteDeps: FeeProxyDepositQuoteDeps = {
	multiVault: feeProxyMultiVault,
	affiliateConfig: feeProxyAffiliateConfig,
	previewDepositFee: feeProxyPreviewDepositFee,
	previewDeposit: multiVaultPreviewDeposit,
	getGeneralConfig: multiVaultGetGeneralConfig,
};

const defaultCreatePlanDeps: FeeProxyCreatePlanDeps = {
	...defaultReadinessDeps,
	previewCreationFee: feeProxyPreviewCreationFee,
	getAtomCost: multiVaultGetAtomCost,
	getTripleCost: multiVaultGetTripleCost,
	getAtomUriConfig: multiVaultGetAtomUriConfig,
	calculateAtomId: multiVaultCalculateAtomId,
	calculateTripleId: multiVaultCalculateTripleId,
	previewAtomCreate: multiVaultPreviewAtomCreate,
	previewTripleCreate: multiVaultPreviewTripleCreate,
};

type ApprovalRequirement = {
	/** The account that calls `MultiVault.approve`. */
	granter: Address;
	/** The account being approved. */
	spender: Address;
	bit: number;
	code: FeeProxyReadinessIssueCode;
	message: string;
};

function pairKey(granter: Address, spender: Address): string {
	return `${granter.toLowerCase()}:${spender.toLowerCase()}`;
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
	return (numerator + denominator - 1n) / denominator;
}

function sumBigints(values: readonly bigint[]): bigint {
	let total = 0n;
	for (const value of values) {
		total += value;
	}
	return total;
}

function assertSlippageBps(slippageBps: bigint): void {
	if (slippageBps < 0n || slippageBps >= BPS_DENOMINATOR) {
		throw new Error('slippageBps must be between 0 and 9999 (basis points).');
	}
}

/**
 * Reads the full approval bitmask `granter` holds for `spender`. `MultiVault.approve` replaces the
 * whole bitmask, so an approval step has to carry every bit already granted, not only the new one.
 */
async function readApprovalBits(
	multiVault: ReadConfig,
	granter: Address,
	spender: Address,
	deps: FeeProxyReadinessDeps
): Promise<number> {
	const [deposit, redemption, creation] = await Promise.all([
		deps.isApprovedToDeposit(multiVault, { args: [spender, granter] }),
		deps.isApprovedToRedeem(multiVault, { args: [spender, granter] }),
		deps.isApprovedToCreate(multiVault, { args: [spender, granter] }),
	]);
	return (
		(deposit ? ApprovalTypes.DEPOSIT : 0) |
		(redemption ? ApprovalTypes.REDEMPTION : 0) |
		(creation ? ApprovalTypes.CREATION : 0)
	);
}

/**
 * Reads the MultiVault FeeProxy forwards to and throws unless it is `configs.multiVault`. Approvals,
 * costs and previews are read from `configs.multiVault`, so a plan built against another MultiVault
 * would check the wrong approvals and could forward too little.
 */
async function assertFeeProxyTargetsMultiVault(
	configs: FeeProxyConfigs,
	deps: FeeProxyTargetDeps
): Promise<void> {
	const target = await deps.multiVault(configs.feeProxy);
	if (!isAddressEqual(target, configs.multiVault.address)) {
		throw new Error(
			`FeeProxy ${configs.feeProxy.address} forwards to MultiVault ${target}, not configs.multiVault ${configs.multiVault.address}; pass the MultiVault FeeProxy uses.`
		);
	}
}

function throwOnBlockers(readiness: FeeProxyReadiness): void {
	const blockers = readiness.missing.filter((issue) => !issue.fixable);
	if (blockers.length > 0) {
		throw new Error(
			`FeeProxy route is blocked: ${blockers.map((issue) => `${issue.code} (${issue.message})`).join('; ')}`
		);
	}
}

type FeeProxyReadinessInputs = {
	user: Address;
	affiliate: Address;
	receiver?: Address;
	kinds: FeeProxyRouteKind[];
};

/**
 * Checks everything a FeeProxy deposit or create needs before it can land, mirroring the checks
 * the contract makes in order: the global pause, an active affiliate, the affiliate's fees on the
 * used side within the current protocol caps, and the MultiVault approvals. First reads FeeProxy's
 * `multiVault()` and throws unless it is `configs.multiVault`, where the approvals are read.
 *
 * Deposits need `receiver` to have approved FeeProxy for DEPOSIT, and, when `receiver` is not the
 * caller, `receiver` to have approved the caller for DEPOSIT too (`FeeProxy_ReceiverNotApproved`).
 * Both approvals are signed by `receiver`. Creates need the caller to have approved FeeProxy for
 * CREATION. Approval steps preserve every bit already granted and merge requirements on the same
 * pair into one `approve`, because `approve` overwrites the bitmask.
 * @param configs FeeProxy and MultiVault read configs.
 * @param inputs The caller, the affiliate, the deposit receiver (defaults to the caller) and the route kinds to check.
 * @param deps Injectable read primitives.
 * @returns Whether the route is ready, what is missing, the approval transactions that fix it, and any pending refund.
 */
export async function feeProxyGetReadiness(
	configs: FeeProxyConfigs,
	inputs: FeeProxyReadinessInputs,
	deps: FeeProxyReadinessDeps = defaultReadinessDeps
): Promise<FeeProxyReadiness> {
	await assertFeeProxyTargetsMultiVault(configs, deps);
	return await readReadiness(configs, inputs, deps);
}

async function readReadiness(
	configs: FeeProxyConfigs,
	inputs: FeeProxyReadinessInputs,
	deps: FeeProxyReadinessDeps
): Promise<FeeProxyReadiness> {
	const { user, affiliate, kinds } = inputs;
	const receiver = inputs.receiver ?? user;
	if (kinds.length === 0) {
		throw new Error('At least one route kind is required.');
	}
	const feeProxyAddress = configs.feeProxy.address;
	const wantsDeposit = kinds.includes('deposit');
	const wantsCreate = kinds.includes('create');

	const requirements: ApprovalRequirement[] = [];
	if (wantsDeposit) {
		requirements.push({
			granter: receiver,
			spender: feeProxyAddress,
			bit: ApprovalTypes.DEPOSIT,
			code: 'receiver-has-not-approved-proxy-for-deposit',
			message: `${receiver} must approve FeeProxy for DEPOSIT on MultiVault.`,
		});
		if (!isAddressEqual(receiver, user)) {
			requirements.push({
				granter: receiver,
				spender: user,
				bit: ApprovalTypes.DEPOSIT,
				code: 'receiver-has-not-approved-caller-for-deposit',
				message: `${receiver} must approve the caller ${user} for DEPOSIT on MultiVault.`,
			});
		}
	}
	if (wantsCreate) {
		requirements.push({
			granter: user,
			spender: feeProxyAddress,
			bit: ApprovalTypes.CREATION,
			code: 'caller-has-not-approved-proxy-for-creation',
			message: `${user} must approve FeeProxy for CREATION on MultiVault.`,
		});
	}

	const pairs = new Map<string, { granter: Address; spender: Address }>();
	for (const requirement of requirements) {
		pairs.set(pairKey(requirement.granter, requirement.spender), requirement);
	}
	const pairList = [...pairs.entries()];

	const [paused, row, maxFeeBps, maxFixedFee, pendingRefund, pairBits] = await Promise.all([
		deps.paused(configs.feeProxy),
		deps.affiliateConfig(configs.feeProxy, { args: [affiliate] }),
		deps.maxFeeBps(configs.feeProxy),
		deps.maxFixedFee(configs.feeProxy),
		deps.pendingRefund(configs.feeProxy, { args: [user] }),
		Promise.all(
			pairList.map(([, pair]) =>
				readApprovalBits(configs.multiVault, pair.granter, pair.spender, deps)
			)
		),
	]);
	const bitsByPair = new Map(pairList.map(([key], index) => [key, pairBits[index] ?? 0]));

	const missing: FeeProxyReadinessIssue[] = [];
	if (paused) {
		missing.push({ code: 'proxy-paused', message: 'FeeProxy is globally paused.', fixable: false });
	}
	if (row.registeredAt === 0n) {
		missing.push({
			code: 'affiliate-not-registered',
			message: `${affiliate} is not a registered affiliate.`,
			fixable: false,
		});
	} else {
		if (row.paused) {
			missing.push({
				code: 'affiliate-paused',
				message: `${affiliate} is paused.`,
				fixable: false,
			});
		}
		if (
			wantsDeposit &&
			(row.fees.depositBps > maxFeeBps || row.fees.depositFixedFee > maxFixedFee)
		) {
			missing.push({
				code: 'deposit-fees-over-cap',
				message: `${affiliate} deposit fees exceed the protocol caps; the affiliate must lower them.`,
				fixable: false,
			});
		}
		if (
			wantsCreate &&
			(row.fees.creationBps > maxFeeBps || row.fees.creationFixedFee > maxFixedFee)
		) {
			missing.push({
				code: 'creation-fees-over-cap',
				message: `${affiliate} creation fees exceed the protocol caps; the affiliate must lower them.`,
				fixable: false,
			});
		}
	}

	const neededBits = new Map<string, number>();
	for (const requirement of requirements) {
		const key = pairKey(requirement.granter, requirement.spender);
		if (((bitsByPair.get(key) ?? 0) & requirement.bit) === 0) {
			missing.push({ code: requirement.code, message: requirement.message, fixable: true });
			neededBits.set(key, (neededBits.get(key) ?? 0) | requirement.bit);
		}
	}

	const approvalSteps: FeeProxyPlanStep[] = [];
	for (const [key, pair] of pairList) {
		const needed = neededBits.get(key);
		if (needed === undefined) {
			continue;
		}
		const approvalType = ((bitsByPair.get(key) ?? 0) | needed) as ApprovalTypes;
		approvalSteps.push({
			kind: 'approve',
			from: pair.granter,
			to: configs.multiVault.address,
			data: multiVaultApproveEncode(pair.spender, approvalType),
			value: 0n,
			description: `Approve ${pair.spender} on MultiVault (approval bits ${approvalType}, existing bits kept).`,
		});
	}

	return {
		ready: missing.length === 0,
		user,
		affiliate,
		receiver,
		kinds: [...kinds],
		missing,
		approvalSteps,
		pendingRefund,
	};
}

export type FeeProxyDepositInput = { termId: Hex; curveId: bigint; grossAssets: bigint };

export type FeeProxyDepositLegQuote = FeeProxyDepositInput & {
	/** What MultiVault receives for this leg after the affiliate fee and the pro-rata split. */
	forwardedAssets: bigint;
	/**
	 * The least this leg can receive if the affiliate lowers its deposit fee before the call lands
	 * (the `FeeGuard` lets decreases through). A lower fee forwards more in total, but the last leg of a
	 * batch takes the rounding remainder and can get up to one wei per other leg less than quoted.
	 * Equal to `forwardedAssets` for every other leg.
	 */
	minForwardedAssets: bigint;
	/** `MultiVault.previewDeposit` on the forwarded amount. */
	expectedShares: bigint;
	/** `MultiVault.previewDeposit` on `minForwardedAssets`, less slippage: the `minShares` the call carries. */
	minShares: bigint;
};

export type FeeProxyDepositViaQuote = {
	affiliate: Address;
	method: 'depositVia' | 'depositBatchVia';
	legs: FeeProxyDepositLegQuote[];
	totalGrossAssets: bigint;
	affiliateFee: bigint;
	totalForwardedAssets: bigint;
	slippageBps: bigint;
	/** The exact `msg.value` to send: the total gross. Anything above it is refunded. */
	value: bigint;
	/** Pinned to the affiliate's current deposit fees, so the call reverts if they rise before it lands. */
	feeGuard: FeeGuard;
};

type FeeProxyDepositQuoteInputs = {
	affiliate: Address;
	deposits: FeeProxyDepositInput[];
	slippageBps?: bigint;
	batch?: boolean;
};

/**
 * Quotes a FeeProxy deposit: the affiliate fee from on-chain `previewDepositFee` on the total gross,
 * the per-leg forwarded split (FeeProxy `_allocate`, cross-checked against the preview), then
 * `MultiVault.previewDeposit` on each forwarded leg for the expected shares. `minShares` is
 * previewed on each leg's `minForwardedAssets`, so a fee cut before inclusion cannot trip it. One
 * leg quotes `depositVia`; several (or `batch: true`) quote `depositBatchVia`, which charges one
 * fixed fee for the whole batch. First reads FeeProxy's `multiVault()` and throws unless it is
 * `configs.multiVault`.
 * @param configs FeeProxy and MultiVault read configs.
 * @param inputs The affiliate, the deposits, slippage in bps (default 100) and whether to force the batch entry point.
 * @param deps Injectable read primitives.
 * @returns The quote, including the exact value to send and the pinned `FeeGuard`.
 */
export async function feeProxyQuoteDepositVia(
	configs: FeeProxyConfigs,
	inputs: FeeProxyDepositQuoteInputs,
	deps: FeeProxyDepositQuoteDeps = defaultDepositQuoteDeps
): Promise<FeeProxyDepositViaQuote> {
	await assertFeeProxyTargetsMultiVault(configs, deps);
	return await quoteDeposit(configs, inputs, deps);
}

async function quoteDeposit(
	configs: FeeProxyConfigs,
	inputs: FeeProxyDepositQuoteInputs,
	deps: FeeProxyDepositQuoteDeps
): Promise<FeeProxyDepositViaQuote> {
	const { affiliate, deposits, slippageBps = DEFAULT_SLIPPAGE_BPS, batch = false } = inputs;
	assertSlippageBps(slippageBps);
	if (deposits.length === 0) {
		throw new Error('At least one deposit is required.');
	}
	const seen = new Set<string>();
	for (const deposit of deposits) {
		if (deposit.grossAssets <= 0n) {
			throw new Error('Every deposit grossAssets must be greater than 0.');
		}
		const key = `${deposit.termId.toLowerCase()}:${deposit.curveId}`;
		if (seen.has(key)) {
			// MultiVault applies batch legs in order, so a repeated vault would be quoted against stale state.
			throw new Error(`Deposit into ${deposit.termId} on curve ${deposit.curveId} appears twice.`);
		}
		seen.add(key);
	}

	const grossAssets = deposits.map((deposit) => deposit.grossAssets);
	const totalGrossAssets = sumBigints(grossAssets);
	const [row, [previewFee, previewForwarded], generalConfig] = await Promise.all([
		deps.affiliateConfig(configs.feeProxy, { args: [affiliate] }),
		deps.previewDepositFee(configs.feeProxy, { args: [affiliate, totalGrossAssets] }),
		deps.getGeneralConfig(configs.multiVault),
	]);
	if (row.registeredAt === 0n) {
		throw new Error(`${affiliate} is not a registered affiliate.`);
	}

	const split = feeProxySplitRouting({
		grossAssets,
		bps: row.fees.depositBps,
		fixedFee: row.fees.depositFixedFee,
	});
	if (split.affiliateFee !== previewFee || split.totalForwardedAssets !== previewForwarded) {
		throw new Error(
			`previewDepositFee (${previewFee}, ${previewForwarded}) disagrees with the affiliate's fee row (${split.affiliateFee}, ${split.totalForwardedAssets}); fees may have changed mid-quote, retry.`
		);
	}

	// A lower fee forwards F' >= F. `_allocate` floors every leading leg at g * F' / G, which only
	// grows, and the last leg gets at least its own share g_last * F' / G >= g_last * F / G.
	const lastIndex = deposits.length - 1;
	const minForwardedAssets = split.forwardedAssets.map((forwarded, index) =>
		index === lastIndex
			? ceilDiv((grossAssets[index] ?? 0n) * split.totalForwardedAssets, totalGrossAssets)
			: forwarded
	);

	const { minDeposit } = multiVaultResolveGeneralConfig(generalConfig);
	for (const [index, forwarded] of split.forwardedAssets.entries()) {
		if (forwarded < minDeposit) {
			throw new Error(
				`Deposit ${index} forwards ${forwarded} after the affiliate fee, below MultiVault minDeposit ${minDeposit}.`
			);
		}
		const minForwarded = minForwardedAssets[index] ?? 0n;
		if (minForwarded < minDeposit) {
			throw new Error(
				`Deposit ${index} can forward as little as ${minForwarded} if the affiliate lowers its fee before the call lands, below MultiVault minDeposit ${minDeposit}.`
			);
		}
	}

	const preview = (deposit: FeeProxyDepositInput, assets: bigint) =>
		deps.previewDeposit(configs.multiVault, { args: [deposit.termId, deposit.curveId, assets] });
	const previews = await Promise.all(
		deposits.map((deposit, index) => preview(deposit, split.forwardedAssets[index] ?? 0n))
	);
	const lastDeposit = deposits[lastIndex];
	const lastMinForwarded = minForwardedAssets[lastIndex] ?? 0n;
	const lastMinPreview =
		lastDeposit && lastMinForwarded !== split.forwardedAssets[lastIndex]
			? await preview(lastDeposit, lastMinForwarded)
			: previews[lastIndex];

	const legs = deposits.map((deposit, index) => {
		const expectedShares = previews[index]?.[0] ?? 0n;
		const sharesAtMin = (index === lastIndex ? lastMinPreview : previews[index])?.[0] ?? 0n;
		return {
			...deposit,
			forwardedAssets: split.forwardedAssets[index] ?? 0n,
			minForwardedAssets: minForwardedAssets[index] ?? 0n,
			expectedShares,
			minShares: (sharesAtMin * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR,
		};
	});

	return {
		affiliate,
		method: deposits.length > 1 || batch ? 'depositBatchVia' : 'depositVia',
		legs,
		totalGrossAssets,
		affiliateFee: split.affiliateFee,
		totalForwardedAssets: split.totalForwardedAssets,
		slippageBps,
		value: totalGrossAssets,
		feeGuard: { maxFeeBps: row.fees.depositBps, maxFixedFee: row.fees.depositFixedFee },
	};
}

export type FeeProxyDepositViaPlan = {
	readiness: FeeProxyReadiness;
	quote: FeeProxyDepositViaQuote;
	/** Approvals first (possibly signed by the receiver), then the routed deposit. */
	steps: FeeProxyPlanStep[];
	value: bigint;
};

/**
 * Builds a FeeProxy deposit plan: readiness, then the quote, then ordered steps — any missing
 * MultiVault approvals first, then `depositVia` / `depositBatchVia` carrying the quoted value,
 * `minShares` and the pinned `FeeGuard`. Throws when FeeProxy does not forward to
 * `configs.multiVault`, or when the route has a blocker no approval can fix (paused proxy, inactive
 * affiliate, fees over the caps). Send with `feeProxyExecutePlan` or any signer, step by step.
 * @param configs FeeProxy and MultiVault read configs.
 * @param inputs The caller, the affiliate, the receiver (defaults to the caller), the deposits and slippage.
 * @param deps Injectable read primitives.
 * @returns The plan.
 */
export async function feeProxyBuildDepositViaPlan(
	configs: FeeProxyConfigs,
	inputs: {
		user: Address;
		affiliate: Address;
		receiver?: Address;
		deposits: FeeProxyDepositInput[];
		slippageBps?: bigint;
		batch?: boolean;
	},
	deps: FeeProxyReadinessDeps & FeeProxyDepositQuoteDeps = {
		...defaultReadinessDeps,
		...defaultDepositQuoteDeps,
	}
): Promise<FeeProxyDepositViaPlan> {
	const { user, affiliate, deposits, slippageBps, batch } = inputs;
	const receiver = inputs.receiver ?? user;

	await assertFeeProxyTargetsMultiVault(configs, deps);
	const readiness = await readReadiness(
		configs,
		{ user, affiliate, receiver, kinds: ['deposit'] },
		deps
	);
	throwOnBlockers(readiness);
	const quote = await quoteDeposit(configs, { affiliate, deposits, slippageBps, batch }, deps);

	const [firstLeg] = quote.legs;
	if (!firstLeg) {
		throw new Error('At least one deposit is required.');
	}
	const data =
		quote.method === 'depositVia'
			? feeProxyDepositViaEncode(
					affiliate,
					receiver,
					firstLeg.termId,
					firstLeg.curveId,
					firstLeg.grossAssets,
					firstLeg.minShares,
					quote.feeGuard
				)
			: feeProxyDepositBatchViaEncode(
					affiliate,
					receiver,
					quote.legs.map((leg) => leg.termId),
					quote.legs.map((leg) => leg.curveId),
					quote.legs.map((leg) => leg.grossAssets),
					quote.legs.map((leg) => leg.minShares),
					quote.feeGuard
				);

	const steps: FeeProxyPlanStep[] = [
		...readiness.approvalSteps,
		{
			kind: quote.method === 'depositVia' ? 'deposit-via' : 'deposit-batch-via',
			from: user,
			to: configs.feeProxy.address,
			data,
			value: quote.value,
			description: `Deposit ${quote.totalGrossAssets} gross through ${affiliate}; ${quote.affiliateFee} affiliate fee, ${quote.totalForwardedAssets} forwarded.`,
		},
	];

	return { readiness, quote, steps, value: sumBigints(steps.map((step) => step.value)) };
}

export type FeeProxyCreateAtomInput = {
	data: Hex;
	/** Creation-time context URIs. Any atom with URIs routes the whole set through `createAtomsWithUrisVia`. */
	uris?: Hex[];
	/** Assets to land in the new vault on top of the creation cost; defaults to `depositPerTerm`. */
	deposit?: bigint;
};

export type FeeProxyCreateTripleInput = {
	subjectId: Hex;
	predicateId: Hex;
	objectId: Hex;
	/** Assets to land in the new vault on top of the creation cost; defaults to `depositPerTerm`. */
	deposit?: bigint;
};

export type FeeProxyCreateViaQuote = FeeProxyGrossUp & {
	method: 'createAtomsVia' | 'createAtomsWithUrisVia' | 'createTriplesVia';
	/** `MultiVault.getAtomCost()` or `getTripleCost()`: every forwarded leg must cover it. */
	costPerTerm: bigint;
	/** The intended deposit per term on top of the cost. */
	deposits: bigint[];
	/** The term IDs the call will create, in leg order. */
	termIds: Hex[];
	/**
	 * `previewAtomCreate` / `previewTripleCreate` on each forwarded leg at the quoted fee. A triple
	 * whose atoms are created earlier in the same plan is previewed against the state before those
	 * atoms exist.
	 */
	expectedShares: bigint[];
	/** The exact `msg.value` to send: the total gross. */
	value: bigint;
	/** Pinned to the affiliate's current creation fees. */
	feeGuard: FeeGuard;
};

export type FeeProxyCreateViaPlan = {
	readiness: FeeProxyReadiness;
	atoms?: FeeProxyCreateViaQuote;
	triples?: FeeProxyCreateViaQuote;
	/** Approval first, then atoms, then triples (so triples can reference atoms from the same plan). */
	steps: FeeProxyPlanStep[];
	value: bigint;
};

/**
 * Builds a FeeProxy creation plan. Each term is grossed up so that after the affiliate's creation
 * bps and its fixed fee (charged once per call) and FeeProxy's pro-rata split, the amount MultiVault
 * receives for that term is at least its creation cost plus the intended deposit, and stays so if
 * the affiliate lowers either fee before the call lands. The total is the least for which the
 * gross-up's per-term split does both, so a term can receive a few wei more than its target (the
 * last term most). The gross-up is computed in bigint (`feeProxyGrossUpForTargets`), then the
 * total is checked against on-chain `previewCreationFee`; any disagreement throws rather than
 * sending a mispriced call. Atoms and triples are separate calls, each paying its own fixed fee.
 * First reads FeeProxy's `multiVault()` and throws unless it is `configs.multiVault`.
 * @param configs FeeProxy and MultiVault read configs.
 * @param inputs The caller (also the creator), the affiliate, atoms and/or triples, and the default deposit per term.
 * @param deps Injectable read primitives.
 * @returns The plan, with the gross-up quote per call.
 */
export async function feeProxyBuildCreateViaPlan(
	configs: FeeProxyConfigs,
	inputs: {
		user: Address;
		affiliate: Address;
		atoms?: FeeProxyCreateAtomInput[];
		triples?: FeeProxyCreateTripleInput[];
		depositPerTerm?: bigint;
	},
	deps: FeeProxyCreatePlanDeps = defaultCreatePlanDeps
): Promise<FeeProxyCreateViaPlan> {
	const { user, affiliate, atoms = [], triples = [], depositPerTerm = 0n } = inputs;
	if (atoms.length === 0 && triples.length === 0) {
		throw new Error('At least one atom or triple is required.');
	}
	const depositOf = (deposit: bigint | undefined) => {
		const value = deposit ?? depositPerTerm;
		if (value < 0n) {
			throw new Error('Deposits must not be negative.');
		}
		return value;
	};
	const atomDeposits = atoms.map((atom) => depositOf(atom.deposit));
	const tripleDeposits = triples.map((triple) => depositOf(triple.deposit));

	await assertFeeProxyTargetsMultiVault(configs, deps);
	const readiness = await readReadiness(configs, { user, affiliate, kinds: ['create'] }, deps);
	throwOnBlockers(readiness);

	const [row, atomCost, tripleCost] = await Promise.all([
		deps.affiliateConfig(configs.feeProxy, { args: [affiliate] }),
		atoms.length > 0 ? deps.getAtomCost(configs.multiVault) : Promise.resolve(0n),
		triples.length > 0 ? deps.getTripleCost(configs.multiVault) : Promise.resolve(0n),
	]);
	const bps = row.fees.creationBps;
	const fixedFee = row.fees.creationFixedFee;
	const feeGuard: FeeGuard = { maxFeeBps: bps, maxFixedFee: fixedFee };

	const grossUp = async (costPerTerm: bigint, termDeposits: bigint[]) => {
		const result = feeProxyGrossUpForTargets({
			targets: termDeposits.map((deposit) => costPerTerm + deposit),
			bps,
			fixedFee,
		});
		const [previewFee, previewForwarded] = await deps.previewCreationFee(configs.feeProxy, {
			args: [affiliate, result.totalGrossAssets],
		});
		if (previewFee !== result.affiliateFee || previewForwarded !== result.totalForwardedAssets) {
			throw new Error(
				`previewCreationFee (${previewFee}, ${previewForwarded}) disagrees with the local gross-up (${result.affiliateFee}, ${result.totalForwardedAssets}); fees may have changed mid-quote, retry.`
			);
		}
		return result;
	};

	// MultiVault takes its own fees, rounded up, on each leg's deposit base; a leg whose base is too
	// small for them reverts there, after the affiliate fee. Every leg is previewed. When the gross-up's
	// rounding margin, not the caller's deposit, put a leg on such a base, that leg is aimed one wei
	// higher and the gross-up redone; a deposit the caller chose that MultiVault rejects still throws.
	type LegPreview = { shares: bigint } | { error: unknown };
	const grossUpAndPreview = async (
		label: string,
		costPerTerm: bigint,
		termDeposits: bigint[],
		preview: (index: number, assets: bigint) => Promise<readonly [bigint, bigint, bigint]>
	) => {
		const margins = termDeposits.map(() => 0n);
		let lastRejection: unknown;
		for (let attempt = 0; attempt <= MAX_CREATE_MARGIN_RETRIES; attempt += 1) {
			const result = await grossUp(
				costPerTerm,
				termDeposits.map((deposit, index) => deposit + (margins[index] ?? 0n))
			);
			const outcomes = await Promise.all(
				result.forwardedAssets.map(async (assets, index): Promise<LegPreview> => {
					try {
						return { shares: (await preview(index, assets))[0] };
					} catch (error) {
						return { error };
					}
				})
			);
			let retry = false;
			for (const [index, outcome] of outcomes.entries()) {
				if (!('error' in outcome)) {
					continue;
				}
				const assets = result.forwardedAssets[index] ?? 0n;
				if (assets <= costPerTerm + (termDeposits[index] ?? 0n)) {
					throw new Error(
						`MultiVault rejects ${label} ${index} with ${assets} forwarded; raise its deposit.`,
						{ cause: outcome.error }
					);
				}
				margins[index] = (margins[index] ?? 0n) + 1n;
				lastRejection = outcome.error;
				retry = true;
			}
			if (!retry) {
				return {
					result,
					expectedShares: outcomes.map((outcome) => ('shares' in outcome ? outcome.shares : 0n)),
				};
			}
		}
		throw new Error(`MultiVault keeps rejecting a ${label} leg above its target; see the cause.`, {
			cause: lastRejection,
		});
	};

	const steps: FeeProxyPlanStep[] = [...readiness.approvalSteps];
	let atomsQuote: FeeProxyCreateViaQuote | undefined;
	let triplesQuote: FeeProxyCreateViaQuote | undefined;

	if (atoms.length > 0) {
		const withUris = atoms.some((atom) => (atom.uris?.length ?? 0) > 0);
		const atomDatas = atoms.map((atom) => atom.data);
		const termIds = await Promise.all(
			atomDatas.map((atomData) => deps.calculateAtomId(configs.multiVault, { args: [atomData] }))
		);
		const { result, expectedShares } = await grossUpAndPreview(
			'atom',
			atomCost,
			atomDeposits,
			(index, assets) =>
				deps.previewAtomCreate(configs.multiVault, { args: [termIds[index] ?? '0x', assets] })
		);
		let data: Hex;
		if (withUris) {
			// Reuses the URI-bounds validation; its own fee preview must match the gross-up too.
			const prepared = await feeProxyPrepareCreateAtomsWithUrisTx(
				configs,
				{
					affiliate,
					atomDatas,
					assets: result.grossAssets,
					uris: atoms.map((atom) => atom.uris ?? []),
					feeGuard,
				},
				{ previewCreationFee: deps.previewCreationFee, getAtomUriConfig: deps.getAtomUriConfig }
			);
			if (prepared.quote.previewedFee !== result.affiliateFee) {
				throw new Error('previewCreationFee changed between reads; retry.');
			}
			data = prepared.calldata;
		} else {
			data = feeProxyCreateAtomsViaEncode(affiliate, atomDatas, result.grossAssets, feeGuard);
		}
		atomsQuote = {
			...result,
			method: withUris ? 'createAtomsWithUrisVia' : 'createAtomsVia',
			costPerTerm: atomCost,
			deposits: atomDeposits,
			termIds,
			expectedShares,
			value: result.totalGrossAssets,
			feeGuard,
		};
		steps.push({
			kind: withUris ? 'create-atoms-with-uris-via' : 'create-atoms-via',
			from: user,
			to: configs.feeProxy.address,
			data,
			value: result.totalGrossAssets,
			description: `Create ${atoms.length} atom(s) through ${affiliate}: ${result.totalGrossAssets} gross, ${result.affiliateFee} affiliate fee.`,
		});
	}

	if (triples.length > 0) {
		const termIds = await Promise.all(
			triples.map((triple) =>
				deps.calculateTripleId(configs.multiVault, {
					args: [triple.subjectId, triple.predicateId, triple.objectId],
				})
			)
		);
		const { result, expectedShares } = await grossUpAndPreview(
			'triple',
			tripleCost,
			tripleDeposits,
			(index, assets) => {
				const triple = triples[index];
				if (!triple) {
					throw new Error(`Missing triple ${index}.`);
				}
				return deps.previewTripleCreate(configs.multiVault, {
					args: [triple.subjectId, triple.predicateId, triple.objectId, assets],
				});
			}
		);
		triplesQuote = {
			...result,
			method: 'createTriplesVia',
			costPerTerm: tripleCost,
			deposits: tripleDeposits,
			termIds,
			expectedShares,
			value: result.totalGrossAssets,
			feeGuard,
		};
		steps.push({
			kind: 'create-triples-via',
			from: user,
			to: configs.feeProxy.address,
			data: feeProxyCreateTriplesViaEncode(
				affiliate,
				triples.map((triple) => triple.subjectId),
				triples.map((triple) => triple.predicateId),
				triples.map((triple) => triple.objectId),
				result.grossAssets,
				feeGuard
			),
			value: result.totalGrossAssets,
			description: `Create ${triples.length} triple(s) through ${affiliate}: ${result.totalGrossAssets} gross, ${result.affiliateFee} affiliate fee.`,
		});
	}

	return {
		readiness,
		atoms: atomsQuote,
		triples: triplesQuote,
		steps,
		value: sumBigints(steps.map((step) => step.value)),
	};
}

export type FeeProxyExecutedStep = {
	step: FeeProxyPlanStep;
	hash: Hex;
	receipt: TransactionReceipt;
};

/**
 * Sends a FeeProxy plan's steps in order from one wallet, waiting for each receipt before the
 * next (an approval must be mined before the routed call that needs it). Refuses up front, before
 * sending anything, when a step must be signed by a different account — for example a receiver's
 * approval in a delegated deposit; send those steps from the receiver's wallet first.
 * @param config The signing wallet client and a public client for receipts.
 * @param plan Any plan with `steps`.
 * @returns Each step with its transaction hash and receipt.
 */
export async function feeProxyExecutePlan(
	config: { walletClient: WalletClient; publicClient: PublicClient },
	plan: { steps: readonly FeeProxyPlanStep[] }
): Promise<FeeProxyExecutedStep[]> {
	const { walletClient, publicClient } = config;
	const account = walletClient.account;
	if (!account) {
		throw new Error('walletClient has no account to sign with.');
	}
	for (const step of plan.steps) {
		if (!isAddressEqual(step.from, account.address)) {
			throw new Error(
				`Step ${step.kind} must be signed by ${step.from}, not ${account.address}; nothing was sent.`
			);
		}
	}

	const executed: FeeProxyExecutedStep[] = [];
	for (const step of plan.steps) {
		const hash = await walletClient.sendTransaction({
			account,
			chain: walletClient.chain,
			to: step.to,
			data: step.data,
			value: step.value,
		});
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		if (receipt.status !== 'success') {
			throw new Error(`Step ${step.kind} reverted in ${hash}.`);
		}
		executed.push({ step, hash, receipt });
	}
	return executed;
}

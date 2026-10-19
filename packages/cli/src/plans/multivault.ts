import {
	multivaultCreateAndSeedTerm,
	multivaultPrepareDepositTx,
	multivaultPrepareMulticallTx,
	multivaultPrepareOnBehalfOfCreationPlan,
	multivaultPrepareRedeemTx,
} from '@0xintuition/sdk';
import type { Address, Hex } from 'viem';

import {
	buildPlanEnvelope,
	buildPlanStep,
	type CurveRedeemFeeReadContext,
	type MultiVaultFeeReadContext,
	requireContext,
	toCurveRedeemFeeDeps,
	toFeeContextDeps,
	toPureReadConfig,
	toPureWriteConfig,
} from './helpers';

type IntuitionCoreChainId = 1155 | 13579;

type MultiVaultPreviewDepositResult =
	| readonly [bigint, bigint]
	| {
			sharesOut: bigint;
			assetsAfterFees: bigint;
	  };

type MultiVaultPreviewRedeemResult =
	| readonly [bigint, bigint]
	| {
			assetsOut: bigint;
			sharesUsed: bigint;
	  };

type MultiVaultPreviewCreateResult =
	| readonly [bigint, bigint, bigint]
	| {
			sharesOut: bigint;
			feeBaseAssets: bigint;
			assetsAfterFees: bigint;
	  };

export type MultiVaultDepositPlanReadContext = MultiVaultFeeReadContext & {
	previewDeposit?: MultiVaultPreviewDepositResult;
	entryFeeAmount?: bigint;
	protocolFeeAmount?: bigint;
	currentSharePrice?: bigint;
};

export type MultiVaultRedeemPlanReadContext = MultiVaultFeeReadContext &
	CurveRedeemFeeReadContext & {
		/** Gross assets the shares convert to, before any fee. Replaces the holder-agnostic preview. */
		convertToAssets?: bigint;
		exitFeeAmount?: bigint;
		protocolFeeAmount?: bigint;
		currentSharePrice?: bigint;
	};

export type MultiVaultCreatePlanReadContext = {
	previewCreate?: MultiVaultPreviewCreateResult;
};

export type MultiVaultCreateAtomPlanInput = {
	termId: Hex;
	data: Hex;
	assetsIn: bigint;
	readContext?: MultiVaultCreatePlanReadContext;
};

export type MultiVaultCreateTriplePlanInput = {
	termId: Hex;
	subjectId: Hex;
	predicateId: Hex;
	objectId: Hex;
	assetsIn: bigint;
	readContext?: MultiVaultCreatePlanReadContext;
};

export type MultiVaultSeedDepositPlanInput = {
	termId: Hex;
	curveId: bigint;
	assetsIn: bigint;
	slippageBps?: bigint;
	readContext?: MultiVaultDepositPlanReadContext;
};

export type BuildMultiVaultDepositPlanInputs = {
	chainId?: IntuitionCoreChainId;
	multiVaultAddress: Address;
	receiver: Address;
	termId: Hex;
	curveId: bigint;
	assetsIn: bigint;
	slippageBps?: bigint;
	value?: bigint;
	readContext?: MultiVaultDepositPlanReadContext;
};

export type BuildMultiVaultRedeemPlanInputs = {
	chainId?: IntuitionCoreChainId;
	multiVaultAddress: Address;
	receiver: Address;
	termId: Hex;
	curveId: bigint;
	/** The account redeeming. A curve whose withdrawal rate keys on the holder needs to know who. */
	account: Address;
	sharesIn: bigint;
	slippageBps?: bigint;
	readContext?: MultiVaultRedeemPlanReadContext;
};

export type BuildMultiVaultCreateAndSeedPlanInputs = {
	chainId?: IntuitionCoreChainId;
	multiVaultAddress: Address;
	receiver: Address;
	atomsToCreate?: MultiVaultCreateAtomPlanInput[];
	triplesToCreate?: MultiVaultCreateTriplePlanInput[];
	seedDeposits?: MultiVaultSeedDepositPlanInput[];
};

function toPreviewDepositTuple(value: MultiVaultPreviewDepositResult): readonly [bigint, bigint] {
	if ('sharesOut' in value) {
		return [value.sharesOut, value.assetsAfterFees] as const;
	}

	return [value[0], value[1]] as const;
}

function toPreviewRedeemTuple(value: MultiVaultPreviewRedeemResult): readonly [bigint, bigint] {
	if ('assetsOut' in value) {
		return [value.assetsOut, value.sharesUsed] as const;
	}

	return [value[0], value[1]] as const;
}

function toPreviewCreateTuple(
	value: MultiVaultPreviewCreateResult
): readonly [bigint, bigint, bigint] {
	if ('sharesOut' in value) {
		return [value.sharesOut, value.feeBaseAssets, value.assetsAfterFees] as const;
	}

	return [value[0], value[1], value[2]] as const;
}

function makeCreatePreviewKey(termId: Hex, assetsIn: bigint): string {
	return `${termId}:${assetsIn.toString()}`;
}

/** Triple previews are keyed on the atom ids the contract quotes against, not the triple id. */
function makeTriplePreviewKey(
	subjectId: Hex,
	predicateId: Hex,
	objectId: Hex,
	assetsIn: bigint
): string {
	return `${subjectId}:${predicateId}:${objectId}:${assetsIn.toString()}`;
}

function makeDepositPreviewKey(termId: Hex, curveId: bigint, assetsIn: bigint): string {
	return `${termId}:${curveId.toString()}:${assetsIn.toString()}`;
}

function makeSharePriceKey(termId: Hex, curveId: bigint): string {
	return `${termId}:${curveId.toString()}`;
}

function makeAmountKey(amount: bigint): string {
	return amount.toString();
}

function pushMapValue<T>(map: Map<string, T[]>, key: string, value: T | undefined): void {
	if (value === undefined) {
		return;
	}

	const existing = map.get(key);
	if (existing) {
		existing.push(value);
		return;
	}

	map.set(key, [value]);
}

function takeMapValue<T>(map: Map<string, T[]>, key: string, message: string): T {
	const values = map.get(key);
	const value = values?.shift();
	if (value === undefined) {
		throw new Error(message);
	}

	return value;
}

export async function buildMultiVaultDepositPlan(inputs: BuildMultiVaultDepositPlanInputs) {
	const planName = 'buildMultiVaultDepositPlan';
	const {
		chainId = 1155,
		multiVaultAddress,
		receiver,
		termId,
		curveId,
		assetsIn,
		slippageBps,
		value = assetsIn,
		readContext,
	} = inputs;

	const deps = {
		...toFeeContextDeps(readContext),
		previewDeposit: async () =>
			toPreviewDepositTuple(
				requireContext(readContext?.previewDeposit, planName, 'readContext.previewDeposit')
			),
		entryFeeAmount: async () =>
			requireContext(readContext?.entryFeeAmount, planName, 'readContext.entryFeeAmount'),
		protocolFeeAmount: async () =>
			requireContext(readContext?.protocolFeeAmount, planName, 'readContext.protocolFeeAmount'),
		currentSharePrice: async () =>
			requireContext(readContext?.currentSharePrice, planName, 'readContext.currentSharePrice'),
	} satisfies NonNullable<Parameters<typeof multivaultPrepareDepositTx>[2]>;

	const prepared = await multivaultPrepareDepositTx(
		toPureWriteConfig(multiVaultAddress),
		{
			receiver,
			termId,
			curveId,
			assetsIn,
			slippageBps,
			value,
		},
		deps
	);

	return buildPlanEnvelope({
		action: 'multivault.deposit',
		module: 'plans/multivault',
		method: planName,
		label: 'MultiVault deposit',
		description: 'Deposits native assets into an Intuition MultiVault curve.',
		tags: ['multivault', 'deposit'],
		context: {
			multiVaultAddress,
			receiver,
			termId,
			curveId,
		},
		steps: [
			buildPlanStep({
				id: 'multivault-deposit',
				intent: {
					chainId,
					contract: 'multivault',
				},
				data: prepared.calldata,
				value,
				label: 'Deposit',
				description: 'Submit the slippage-bounded MultiVault deposit.',
			}),
		],
		estimates: {
			quote: prepared.quote,
			value,
		},
	});
}

export async function buildMultiVaultRedeemPlan(inputs: BuildMultiVaultRedeemPlanInputs) {
	const planName = 'buildMultiVaultRedeemPlan';
	const {
		chainId = 1155,
		multiVaultAddress,
		receiver,
		termId,
		curveId,
		account,
		sharesIn,
		slippageBps,
		readContext,
	} = inputs;

	const deps = {
		...toFeeContextDeps(readContext),
		...toCurveRedeemFeeDeps(readContext),
		convertToAssets: async () =>
			requireContext(readContext?.convertToAssets, planName, 'readContext.convertToAssets'),
		exitFeeAmount: async () =>
			requireContext(readContext?.exitFeeAmount, planName, 'readContext.exitFeeAmount'),
		protocolFeeAmount: async () =>
			requireContext(readContext?.protocolFeeAmount, planName, 'readContext.protocolFeeAmount'),
		currentSharePrice: async () =>
			requireContext(readContext?.currentSharePrice, planName, 'readContext.currentSharePrice'),
	} satisfies NonNullable<Parameters<typeof multivaultPrepareRedeemTx>[2]>;

	const prepared = await multivaultPrepareRedeemTx(
		toPureWriteConfig(multiVaultAddress),
		{
			receiver,
			termId,
			curveId,
			account,
			sharesIn,
			slippageBps,
		},
		deps
	);

	return buildPlanEnvelope({
		action: 'multivault.redeem',
		module: 'plans/multivault',
		method: planName,
		label: 'MultiVault redeem',
		description: 'Redeems MultiVault shares into native assets.',
		tags: ['multivault', 'redeem'],
		context: {
			multiVaultAddress,
			receiver,
			termId,
			curveId,
		},
		steps: [
			buildPlanStep({
				id: 'multivault-redeem',
				intent: {
					chainId,
					contract: 'multivault',
				},
				data: prepared.calldata,
				label: 'Redeem',
				description: 'Redeem shares with a slippage-bounded minimum assets out.',
			}),
		],
		estimates: {
			quote: prepared.quote,
		},
	});
}

export async function buildMultiVaultCreateAndSeedPlan(
	inputs: BuildMultiVaultCreateAndSeedPlanInputs
) {
	const planName = 'buildMultiVaultCreateAndSeedPlan';
	const {
		chainId = 1155,
		multiVaultAddress,
		receiver,
		atomsToCreate = [],
		triplesToCreate = [],
		seedDeposits = [],
	} = inputs;

	const atomPreviewMap = new Map<string, MultiVaultPreviewCreateResult[]>();
	const triplePreviewMap = new Map<string, MultiVaultPreviewCreateResult[]>();
	const depositPreviewMap = new Map<string, MultiVaultPreviewDepositResult[]>();
	const entryFeeMap = new Map<string, bigint[]>();
	const protocolFeeMap = new Map<string, bigint[]>();
	const sharePriceMap = new Map<string, bigint[]>();

	for (const atom of atomsToCreate) {
		pushMapValue(
			atomPreviewMap,
			makeCreatePreviewKey(atom.termId, atom.assetsIn),
			atom.readContext?.previewCreate
		);
	}

	for (const triple of triplesToCreate) {
		pushMapValue(
			triplePreviewMap,
			makeTriplePreviewKey(triple.subjectId, triple.predicateId, triple.objectId, triple.assetsIn),
			triple.readContext?.previewCreate
		);
	}

	for (const seed of seedDeposits) {
		pushMapValue(
			depositPreviewMap,
			makeDepositPreviewKey(seed.termId, seed.curveId, seed.assetsIn),
			seed.readContext?.previewDeposit
		);
		pushMapValue(entryFeeMap, makeAmountKey(seed.assetsIn), seed.readContext?.entryFeeAmount);
		pushMapValue(protocolFeeMap, makeAmountKey(seed.assetsIn), seed.readContext?.protocolFeeAmount);
		pushMapValue(
			sharePriceMap,
			makeSharePriceKey(seed.termId, seed.curveId),
			seed.readContext?.currentSharePrice
		);
	}

	const deps = {
		previewAtomCreate: async (_config, request) =>
			toPreviewCreateTuple(
				takeMapValue(
					atomPreviewMap,
					makeCreatePreviewKey(request.args[0], request.args[1]),
					`${planName} requires atomsToCreate[].readContext.previewCreate.`
				)
			),
		previewTripleCreate: async (_config, request) =>
			toPreviewCreateTuple(
				takeMapValue(
					triplePreviewMap,
					makeTriplePreviewKey(request.args[0], request.args[1], request.args[2], request.args[3]),
					`${planName} requires triplesToCreate[].readContext.previewCreate.`
				)
			),
		previewDeposit: async (_config, request) =>
			toPreviewDepositTuple(
				takeMapValue(
					depositPreviewMap,
					makeDepositPreviewKey(request.args[0], request.args[1], request.args[2]),
					`${planName} requires seedDeposits[].readContext.previewDeposit.`
				)
			),
		entryFeeAmount: async (_config, request) =>
			takeMapValue(
				entryFeeMap,
				makeAmountKey(request.args[0]),
				`${planName} requires seedDeposits[].readContext.entryFeeAmount.`
			),
		protocolFeeAmount: async (_config, request) =>
			takeMapValue(
				protocolFeeMap,
				makeAmountKey(request.args[0]),
				`${planName} requires seedDeposits[].readContext.protocolFeeAmount.`
			),
		currentSharePrice: async (_config, request) =>
			takeMapValue(
				sharePriceMap,
				makeSharePriceKey(request.args[0], request.args[1]),
				`${planName} requires seedDeposits[].readContext.currentSharePrice.`
			),
		...toFeeContextDeps(),
	} satisfies NonNullable<Parameters<typeof multivaultCreateAndSeedTerm>[2]>;

	const plan = await multivaultCreateAndSeedTerm(
		toPureWriteConfig(multiVaultAddress),
		{
			receiver,
			atomsToCreate,
			triplesToCreate,
			seedDeposits,
		},
		deps
	);

	return buildPlanEnvelope({
		action: 'multivault.createAndSeed',
		module: 'plans/multivault',
		method: planName,
		label: 'MultiVault create and seed',
		description: 'Creates atoms/triples and seeds their initial MultiVault positions.',
		tags: ['multivault', 'create', 'seed'],
		context: {
			multiVaultAddress,
			receiver,
			atomCount: atomsToCreate.length,
			tripleCount: triplesToCreate.length,
			seedCount: seedDeposits.length,
		},
		steps: plan.steps.map((step, index) =>
			buildPlanStep({
				id: `${step.type}-${index + 1}`,
				intent: {
					chainId,
					contract: 'multivault',
				},
				data: step.calldata,
				value: step.value,
				label: step.type,
			})
		),
		estimates: {
			receiver: plan.receiver,
			totalValue: plan.totalValue,
			createAtomPreviews: plan.createAtomPreviews,
			createTriplePreviews: plan.createTriplePreviews,
			seedDepositQuotes: plan.seedDepositQuotes,
		},
	});
}

export type MultiVaultOnBehalfOfAtomPlanInput = { data: Hex; assets: bigint };
export type MultiVaultOnBehalfOfTriplePlanInput = {
	subjectId: Hex;
	predicateId: Hex;
	objectId: Hex;
	assets: bigint;
};

export type BuildMultiVaultOnBehalfOfCreationPlanInputs = {
	chainId?: IntuitionCoreChainId;
	multiVaultAddress: Address;
	creator: Address;
	caller: Address;
	atoms?: MultiVaultOnBehalfOfAtomPlanInput[];
	triples?: MultiVaultOnBehalfOfTriplePlanInput[];
	approvalAlreadyGranted: boolean;
	/**
	 * Whether `creator` already granted `caller` DEPOSIT/REDEMPTION approval. `approve`
	 * REPLACES the caller's entire approval bitmask rather than adding a bit, so these
	 * must be read live before invoking this plan — omitting them (or defaulting them to
	 * `false`) would silently revoke any existing grant the approval step writes over.
	 */
	hasDepositApproval: boolean;
	hasRedemptionApproval: boolean;
};

/**
 * Builds an on-behalf-of creation plan: `createAtomsFor` / `createTriplesFor` require
 * `creator` to have granted `caller` CREATION approval first, so this prepends an
 * `approve` step when the caller reports it isn't granted yet. The approval step and
 * the creation steps have DIFFERENT required signers (`creator` vs `caller`), surfaced
 * per-step via `metadata.context.signer` — routing each step to the right signer is the
 * caller's responsibility.
 * @param inputs Chain, MultiVault address, the creator/caller pair, the atoms/triples to create, and the caller's current CREATION/DEPOSIT/REDEMPTION approval state (read live before invoking this plan).
 * @returns An agent-action envelope with the ordered approval (if needed) and creation steps.
 */
export async function buildMultiVaultOnBehalfOfCreationPlan(
	inputs: BuildMultiVaultOnBehalfOfCreationPlanInputs
) {
	const planName = 'buildMultiVaultOnBehalfOfCreationPlan';
	const {
		chainId = 1155,
		multiVaultAddress,
		creator,
		caller,
		atoms = [],
		triples = [],
		approvalAlreadyGranted,
		hasDepositApproval,
		hasRedemptionApproval,
	} = inputs;

	const plan = await multivaultPrepareOnBehalfOfCreationPlan(
		toPureReadConfig(multiVaultAddress),
		{ creator, caller, atoms, triples },
		{
			isApprovedToCreate: async () => approvalAlreadyGranted,
			isApprovedToDeposit: async () => hasDepositApproval,
			isApprovedToRedeem: async () => hasRedemptionApproval,
		}
	);

	return buildPlanEnvelope({
		action: 'multivault.onBehalfOfCreation',
		module: 'plans/multivault',
		method: planName,
		label: 'MultiVault on-behalf-of creation',
		description: 'Creates atoms/triples attributed to a creator on behalf of a delegated caller.',
		tags: ['multivault', 'create', 'on-behalf-of'],
		context: {
			multiVaultAddress,
			creator,
			caller,
			approvalAlreadyGranted: plan.approvalAlreadyGranted,
		},
		steps: plan.steps.map((step, index) =>
			buildPlanStep({
				id: `${step.type}-${index + 1}`,
				intent: {
					chainId,
					contract: 'multivault',
				},
				data: step.calldata,
				value: step.value,
				label: step.type,
				context: { signer: step.signer },
			})
		),
	});
}

export type MultiVaultMulticallSubCallPlanInput = {
	calldata: Hex;
	value: bigint;
};

export type BuildMultiVaultMulticallPlanInputs = {
	chainId?: IntuitionCoreChainId;
	subCalls: MultiVaultMulticallSubCallPlanInput[];
};

/**
 * Builds a consolidated payable `multicall` batch: assembles the `bytes[]` sub-call
 * array against the aligned `uint256[]` per-sub-call value array, the fiddliest part of
 * building this call by hand.
 * @param inputs Chain and the sub-calls to batch, each with its own calldata and value allocation.
 * @returns An agent-action envelope with the single `multicall` step.
 */
export function buildMultiVaultMulticallPlan(inputs: BuildMultiVaultMulticallPlanInputs) {
	const { chainId = 1155, subCalls } = inputs;

	const prepared = multivaultPrepareMulticallTx(subCalls);

	return buildPlanEnvelope({
		action: 'multivault.multicall',
		module: 'plans/multivault',
		method: 'buildMultiVaultMulticallPlan',
		label: 'MultiVault multicall batch',
		description:
			'Executes a batch of MultiVault sub-calls atomically with explicit per-call value allocation.',
		tags: ['multivault', 'multicall'],
		context: {
			subCallCount: subCalls.length,
		},
		estimates: {
			subCallCount: subCalls.length,
			totalValue: prepared.value,
		},
		steps: [
			buildPlanStep({
				id: 'multivault-multicall',
				intent: {
					chainId,
					contract: 'multivault',
				},
				data: prepared.calldata,
				value: prepared.value,
				label: 'Multicall',
				description: 'Submit the batched sub-calls in a single transaction.',
			}),
		],
	});
}

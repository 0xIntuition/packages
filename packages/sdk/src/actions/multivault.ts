import { feeOnRaw } from '@0xintuition/curves';
import {
	ApprovalTypes,
	baseCurveHasRedeemFeeHook,
	baseCurveQuoteRedeemFee,
	bondingCurveRegistryCurveAddresses,
	bondingCurveRegistryPreviewMint,
	multiVaultApproveEncode,
	multiVaultAtomDepositFractionAmount,
	multiVaultConvertToAssets,
	multiVaultCreateAtomsEncode,
	multiVaultCreateAtomsForEncode,
	multiVaultCreateTriplesEncode,
	multiVaultCreateTriplesForEncode,
	multiVaultCurrentEpoch,
	multiVaultCurrentSharePrice,
	multiVaultDepositBatchEncode,
	multiVaultDepositEncode,
	multiVaultEntryFeeAmount,
	multiVaultExitFeeAmount,
	multiVaultGetAtomConfig,
	multiVaultGetBondingCurveConfig,
	multiVaultGetGeneralConfig,
	multiVaultGetShares,
	multiVaultGetTotalUtilizationForEpoch,
	multiVaultGetTriple,
	multiVaultGetUserLastActiveEpoch,
	multiVaultGetUserUtilizationForEpoch,
	multiVaultGetUserUtilizationInEpoch,
	multiVaultGetVault,
	multiVaultIsApprovedToCreate,
	multiVaultIsApprovedToDeposit,
	multiVaultIsApprovedToRedeem,
	multiVaultIsTriple,
	multiVaultMaxRedeem,
	multiVaultMulticallEncode,
	multiVaultPreviewAtomCreate,
	multiVaultPreviewDeposit,
	multiVaultPreviewTripleCreate,
	multiVaultProtocolFeeAmount,
	multiVaultRedeemEncode,
	multiVaultResolveDefaultCurveId,
	multiVaultResolveGeneralConfig,
	multiVaultResolveVaultTotals,
	type ReadConfig,
	type WriteConfig,
} from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';

const BPS_DENOMINATOR = 10_000n;
const DEFAULT_SLIPPAGE_BPS = 100n;
const DEFAULT_ANALYTICS_WINDOW_SIZE = 10n;

type PreviewDepositTuple = readonly [bigint, bigint] & {
	shares?: bigint;
	assetsAfterFees?: bigint;
};

type PreviewCreateTuple = readonly [bigint, bigint, bigint] & {
	shares?: bigint;
	feeBaseAssets?: bigint;
	assetsAfterFees?: bigint;
};
export type MultiVaultDepositQuotePlan = {
	termId: Hex;
	curveId: bigint;
	assetsIn: bigint;
	/** What every fee was actually charged on — `assetsIn` less any min-share bootstrap cost. */
	feeBaseAssets: bigint;
	minShareCost: bigint;
	isFirstDeposit: boolean;
	sharesOut: bigint;
	minSharesOut: bigint;
	assetsAfterFees: bigint;
	/** Zero when MultiVault waives it below `feeThreshold`. */
	entryFee: bigint;
	entryFeeWaived: boolean;
	protocolFee: bigint;
	/**
	 * The term-type-specific fee charged alongside the other two: the atom-wallet cut on an atom,
	 * the underlying-atom fraction on a triple. Without it the components cannot sum to the whole.
	 */
	termFee: bigint;
	termFeeKind: 'atom-wallet' | 'atom-deposit-fraction';
	termFeeWaived: boolean;
	totalEstimatedFees: bigint;
	currentSharePrice: bigint;
	effectivePricePerShare: bigint | null;
	slippageBps: bigint;
};

export type MultiVaultPrepareDepositTxResult = {
	args: readonly [Address, Hex, bigint, bigint];
	calldata: Hex;
	/** The value to send: the deposit itself, `assetsIn` unless an explicit value was passed. */
	value: bigint;
	quote: MultiVaultDepositQuotePlan;
};

export type MultiVaultUserPositionSnapshot = {
	account: Address;
	termId: Hex;
	curveId: bigint;
	shares: bigint;
	maxRedeemShares: bigint;
	estimatedAssetsForCurrentShares: bigint;
	estimatedAssetsForMaxRedeem: bigint;
	currentSharePrice: bigint;
	vaultTotalAssets: bigint;
	vaultTotalShares: bigint;
	utilization?: {
		epoch: bigint;
		totalForEpoch: bigint;
		userForEpoch: bigint;
		userInEpoch: bigint;
	};
};

export type MultiVaultRedeemQuotePlan = {
	termId: Hex;
	curveId: bigint;
	/** The account whose payout this is. A redeem quote is meaningless without one. */
	account: Address;
	sharesIn: bigint;
	sharesUsed: bigint;
	assetsBeforeFees: bigint;
	assetsOut: bigint;
	minAssetsOut: bigint;
	/** Zero when MultiVault waives it below `feeThreshold`. */
	exitFee: bigint;
	exitFeeWaived: boolean;
	protocolFee: bigint;
	/** The curve's own withdrawal fee for THIS account. Zero on a curve without a redeem hook. */
	curveFee: bigint;
	curveAddress: Address | null;
	totalEstimatedFees: bigint;
	currentSharePrice: bigint;
	effectivePricePerShare: bigint | null;
	slippageBps: bigint;
};

export type MultiVaultPrepareRedeemTxResult = {
	args: readonly [Address, Hex, bigint, bigint, bigint];
	calldata: Hex;
	quote: MultiVaultRedeemQuotePlan;
};

export type MultiVaultCreateAtomInput = {
	termId: Hex;
	data: Hex;
	assetsIn: bigint;
};

export type MultiVaultCreateTripleInput = {
	termId: Hex;
	subjectId: Hex;
	predicateId: Hex;
	objectId: Hex;
	assetsIn: bigint;
};

export type MultiVaultSeedDepositInput = {
	termId: Hex;
	curveId: bigint;
	assetsIn: bigint;
	slippageBps?: bigint;
};

export type MultiVaultCreateAndSeedStep = {
	type: 'create-atoms' | 'create-triples' | 'deposit-batch';
	calldata: Hex;
	value?: bigint;
};

export type MultiVaultCreateAndSeedTermPlan = {
	receiver: Address;
	createAtomPreviews: Array<{
		termId: Hex;
		assetsIn: bigint;
		sharesOut: bigint;
		feeBaseAssets: bigint;
		assetsAfterFees: bigint;
	}>;
	createTriplePreviews: Array<{
		termId: Hex;
		assetsIn: bigint;
		sharesOut: bigint;
		feeBaseAssets: bigint;
		assetsAfterFees: bigint;
	}>;
	seedDepositQuotes: MultiVaultDepositQuotePlan[];
	steps: MultiVaultCreateAndSeedStep[];
	totalValue: bigint;
};

export type MultiVaultUtilizationEpochPoint = {
	epoch: bigint;
	totalForEpoch: bigint;
	deltaFromPreviousTotal: bigint | null;
	userForEpoch?: bigint;
	userInEpoch?: bigint | null;
	deltaFromPreviousUser?: bigint | null;
};

export type MultiVaultUtilizationAnalyticsBundle = {
	startEpoch: bigint;
	endEpoch: bigint;
	currentEpoch: bigint;
	account?: Address;
	lastActiveEpoch?: bigint;
	aggregateTotalUtilization: bigint;
	aggregateUserUtilization?: bigint;
	points: MultiVaultUtilizationEpochPoint[];
};

/** The reads behind the fee base and the fee-threshold gates, shared by both quote paths. */
type MultiVaultFeeContextDeps = {
	getVault: typeof multiVaultGetVault;
	getGeneralConfig: typeof multiVaultGetGeneralConfig;
	getBondingCurveConfig: typeof multiVaultGetBondingCurveConfig;
};

type MultiVaultDepositFeeBaseDeps = MultiVaultFeeContextDeps & {
	isTriple: typeof multiVaultIsTriple;
	previewMint: typeof bondingCurveRegistryPreviewMint;
};

/** The two term-type-specific deposit fees MultiVault charges alongside entry and protocol. */
type MultiVaultTermFeeDeps = {
	getAtomConfig: typeof multiVaultGetAtomConfig;
	getTriple: typeof multiVaultGetTriple;
	atomDepositFractionAmount: typeof multiVaultAtomDepositFractionAmount;
};

type MultiVaultCurveRedeemFeeDeps = {
	getBondingCurveConfig: typeof multiVaultGetBondingCurveConfig;
	curveAddresses: typeof bondingCurveRegistryCurveAddresses;
	hasRedeemFeeHook: typeof baseCurveHasRedeemFeeHook;
	quoteRedeemFee: typeof baseCurveQuoteRedeemFee;
};

type MultiVaultQuoteDeps = MultiVaultDepositFeeBaseDeps &
	MultiVaultTermFeeDeps & {
		previewDeposit: typeof multiVaultPreviewDeposit;
		entryFeeAmount: typeof multiVaultEntryFeeAmount;
		protocolFeeAmount: typeof multiVaultProtocolFeeAmount;
		currentSharePrice: typeof multiVaultCurrentSharePrice;
	};

type MultiVaultRedeemQuoteDeps = MultiVaultFeeContextDeps &
	MultiVaultCurveRedeemFeeDeps & {
		convertToAssets: typeof multiVaultConvertToAssets;
		exitFeeAmount: typeof multiVaultExitFeeAmount;
		protocolFeeAmount: typeof multiVaultProtocolFeeAmount;
		currentSharePrice: typeof multiVaultCurrentSharePrice;
	};

type MultiVaultPositionDeps = {
	getShares: typeof multiVaultGetShares;
	maxRedeem: typeof multiVaultMaxRedeem;
	convertToAssets: typeof multiVaultConvertToAssets;
	currentSharePrice: typeof multiVaultCurrentSharePrice;
	getVault: typeof multiVaultGetVault;
	currentEpoch: typeof multiVaultCurrentEpoch;
	getTotalUtilizationForEpoch: typeof multiVaultGetTotalUtilizationForEpoch;
	getUserUtilizationForEpoch: typeof multiVaultGetUserUtilizationForEpoch;
	getUserUtilizationInEpoch: typeof multiVaultGetUserUtilizationInEpoch;
};

type MultiVaultCreateAndSeedDeps = MultiVaultQuoteDeps & {
	previewAtomCreate: typeof multiVaultPreviewAtomCreate;
	previewTripleCreate: typeof multiVaultPreviewTripleCreate;
};

type MultiVaultUtilizationDeps = {
	currentEpoch: typeof multiVaultCurrentEpoch;
	getTotalUtilizationForEpoch: typeof multiVaultGetTotalUtilizationForEpoch;
	getUserUtilizationForEpoch: typeof multiVaultGetUserUtilizationForEpoch;
	getUserUtilizationInEpoch: typeof multiVaultGetUserUtilizationInEpoch;
	getUserLastActiveEpoch: typeof multiVaultGetUserLastActiveEpoch;
};

const defaultFeeContextDeps: MultiVaultFeeContextDeps = {
	getVault: multiVaultGetVault,
	getGeneralConfig: multiVaultGetGeneralConfig,
	getBondingCurveConfig: multiVaultGetBondingCurveConfig,
};

const defaultDepositFeeBaseDeps: MultiVaultDepositFeeBaseDeps = {
	...defaultFeeContextDeps,
	isTriple: multiVaultIsTriple,
	previewMint: bondingCurveRegistryPreviewMint,
};

const defaultCurveRedeemFeeDeps: MultiVaultCurveRedeemFeeDeps = {
	getBondingCurveConfig: multiVaultGetBondingCurveConfig,
	curveAddresses: bondingCurveRegistryCurveAddresses,
	hasRedeemFeeHook: baseCurveHasRedeemFeeHook,
	quoteRedeemFee: baseCurveQuoteRedeemFee,
};

const defaultTermFeeDeps: MultiVaultTermFeeDeps = {
	getAtomConfig: multiVaultGetAtomConfig,
	getTriple: multiVaultGetTriple,
	atomDepositFractionAmount: multiVaultAtomDepositFractionAmount,
};

const defaultQuoteDeps: MultiVaultQuoteDeps = {
	...defaultDepositFeeBaseDeps,
	...defaultTermFeeDeps,
	previewDeposit: multiVaultPreviewDeposit,
	entryFeeAmount: multiVaultEntryFeeAmount,
	protocolFeeAmount: multiVaultProtocolFeeAmount,
	currentSharePrice: multiVaultCurrentSharePrice,
};

const defaultRedeemQuoteDeps: MultiVaultRedeemQuoteDeps = {
	...defaultFeeContextDeps,
	...defaultCurveRedeemFeeDeps,
	convertToAssets: multiVaultConvertToAssets,
	exitFeeAmount: multiVaultExitFeeAmount,
	protocolFeeAmount: multiVaultProtocolFeeAmount,
	currentSharePrice: multiVaultCurrentSharePrice,
};

const defaultPositionDeps: MultiVaultPositionDeps = {
	getShares: multiVaultGetShares,
	maxRedeem: multiVaultMaxRedeem,
	convertToAssets: multiVaultConvertToAssets,
	currentSharePrice: multiVaultCurrentSharePrice,
	getVault: multiVaultGetVault,
	currentEpoch: multiVaultCurrentEpoch,
	getTotalUtilizationForEpoch: multiVaultGetTotalUtilizationForEpoch,
	getUserUtilizationForEpoch: multiVaultGetUserUtilizationForEpoch,
	getUserUtilizationInEpoch: multiVaultGetUserUtilizationInEpoch,
};

const defaultCreateAndSeedDeps: MultiVaultCreateAndSeedDeps = {
	...defaultQuoteDeps,
	previewAtomCreate: multiVaultPreviewAtomCreate,
	previewTripleCreate: multiVaultPreviewTripleCreate,
};

const defaultUtilizationDeps: MultiVaultUtilizationDeps = {
	currentEpoch: multiVaultCurrentEpoch,
	getTotalUtilizationForEpoch: multiVaultGetTotalUtilizationForEpoch,
	getUserUtilizationForEpoch: multiVaultGetUserUtilizationForEpoch,
	getUserUtilizationInEpoch: multiVaultGetUserUtilizationInEpoch,
	getUserLastActiveEpoch: multiVaultGetUserLastActiveEpoch,
};

function getTupleValue(tuple: readonly unknown[], index: number): bigint {
	const value = tuple[index];
	if (typeof value !== 'bigint') {
		throw new Error(`Expected bigint at tuple index ${index}.`);
	}
	return value;
}

function normalizePreviewDepositResult(result: PreviewDepositTuple): {
	sharesOut: bigint;
	assetsAfterFees: bigint;
} {
	return {
		sharesOut: result.shares ?? getTupleValue(result, 0),
		assetsAfterFees: result.assetsAfterFees ?? getTupleValue(result, 1),
	};
}

function normalizePreviewCreateResult(result: PreviewCreateTuple): {
	sharesOut: bigint;
	feeBaseAssets: bigint;
	assetsAfterFees: bigint;
} {
	return {
		sharesOut: result.shares ?? getTupleValue(result, 0),
		feeBaseAssets: result.feeBaseAssets ?? getTupleValue(result, 1),
		assetsAfterFees: result.assetsAfterFees ?? getTupleValue(result, 2),
	};
}
function validateSlippageBps(slippageBps: bigint): void {
	if (slippageBps < 0n || slippageBps >= BPS_DENOMINATOR) {
		throw new Error('slippageBps must be between 0 and 9999 (basis points).');
	}
}

function applySlippageFloor(amount: bigint, slippageBps: bigint): bigint {
	validateSlippageBps(slippageBps);
	return (amount * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;
}

function getEffectivePricePerShare(assets: bigint, shares: bigint): bigint | null {
	if (shares === 0n) {
		return null;
	}

	return (assets * 10n ** 18n) / shares;
}

function sumBigints(values: bigint[]): bigint {
	let total = 0n;
	for (const value of values) {
		total += value;
	}
	return total;
}

function resolveRange(
	startEpoch: bigint | undefined,
	endEpoch: bigint | undefined,
	currentEpoch: bigint
): { startEpoch: bigint; endEpoch: bigint } {
	const resolvedEnd = endEpoch ?? currentEpoch;
	const fallbackStart =
		resolvedEnd >= DEFAULT_ANALYTICS_WINDOW_SIZE - 1n
			? resolvedEnd - (DEFAULT_ANALYTICS_WINDOW_SIZE - 1n)
			: 0n;
	const resolvedStart = startEpoch ?? fallbackStart;

	if (resolvedStart > resolvedEnd) {
		throw new Error('startEpoch cannot be greater than endEpoch.');
	}

	if (resolvedEnd > currentEpoch) {
		throw new Error('endEpoch cannot be in the future.');
	}

	return { startEpoch: resolvedStart, endEpoch: resolvedEnd };
}

function getEpochsInRange(startEpoch: bigint, endEpoch: bigint): bigint[] {
	const epochs: bigint[] = [];
	for (let epoch = startEpoch; epoch <= endEpoch; epoch += 1n) {
		epochs.push(epoch);
	}
	return epochs;
}

async function getUserUtilizationInEpochSafe(
	deps: MultiVaultUtilizationDeps,
	config: ReadConfig,
	account: Address,
	epoch: bigint
): Promise<bigint | null> {
	try {
		return await deps.getUserUtilizationInEpoch(config, { args: [account, epoch] });
	} catch {
		return null;
	}
}

/* ===================== fee base and fee gating ===================== */

/**
 * The bonding-curve registry MultiVault is configured with.
 *
 * Resolved from MultiVault rather than taken as a parameter, so a caller quoting a deposit does not
 * have to know the registry address to get a correct answer out of it.
 */
async function resolveRegistry(
	config: ReadConfig,
	deps: Pick<MultiVaultFeeContextDeps, 'getBondingCurveConfig'>
): Promise<ReadConfig> {
	const bondingCurveConfig = await deps.getBondingCurveConfig(config);
	const registryAddress = (
		Array.isArray(bondingCurveConfig)
			? bondingCurveConfig[0]
			: (bondingCurveConfig as { registry?: Address }).registry
	) as Address | undefined;

	if (!registryAddress) {
		throw new Error('Unable to resolve the bonding-curve registry from MultiVault.');
	}
	return { address: registryAddress, publicClient: config.publicClient };
}

export type MultiVaultDepositFeeBase = {
	/** The amount every fee — MultiVault's and the curve's — is actually charged on. */
	feeBaseAssets: bigint;
	/** True when this deposit is the one that bootstraps the vault's minimum share supply. */
	isFirstDeposit: boolean;
	/** What the bootstrap costs, netted out before any fee. Zero on an established vault. */
	minShareCost: bigint;
};

/**
 * Resolves the base MultiVault will charge fees on for a deposit.
 *
 * On a vault's first deposit MultiVault nets a min-share bootstrap cost out of the gross assets
 * BEFORE computing any fee (doubled for triples) — see `MultiVaultLib._calculateAtomDeposit`. A quote
 * that applies fee rates to the gross amount therefore disagrees with the contract on exactly that
 * deposit, in every fee component at once. Exported because more than one quote needs it, and
 * because a consumer reconciling a quote against a receipt needs to know which number was quoted.
 * @param config MultiVault address and public client.
 * @param inputs The term, curve and gross assets being deposited.
 * @returns The fee base, whether this is the bootstrapping deposit, and what the bootstrap cost.
 */
export async function multivaultResolveDepositFeeBase(
	config: ReadConfig,
	inputs: { termId: Hex; curveId: bigint; assetsIn: bigint },
	deps: MultiVaultDepositFeeBaseDeps = defaultDepositFeeBaseDeps
): Promise<MultiVaultDepositFeeBase> {
	const { termId, curveId, assetsIn } = inputs;

	const vault = await deps.getVault(config, { args: [termId, curveId] });
	const { totalShares } = multiVaultResolveVaultTotals(vault);

	if (totalShares !== 0n) {
		return { feeBaseAssets: assetsIn, isFirstDeposit: false, minShareCost: 0n };
	}

	const [isTriple, generalConfig, registry] = await Promise.all([
		deps.isTriple(config, { args: [termId] }),
		deps.getGeneralConfig(config),
		resolveRegistry(config, deps),
	]);
	const { minShare } = multiVaultResolveGeneralConfig(generalConfig);
	const perUnitMinShareCost = await deps.previewMint(registry, {
		args: [minShare, 0n, 0n, curveId],
	});
	const minShareCost = isTriple ? perUnitMinShareCost * 2n : perUnitMinShareCost;

	if (assetsIn <= minShareCost) {
		throw new Error(
			`assetsIn (${assetsIn}) does not cover this vault's ${minShareCost}-asset min-share bootstrap cost.`
		);
	}

	return { feeBaseAssets: assetsIn - minShareCost, isFirstDeposit: true, minShareCost };
}

/**
 * The term-type-specific deposit fee: the atom-wallet cut on an atom, or the underlying-atom
 * fraction on a triple.
 *
 * MultiVault charges this alongside its entry and protocol fees, so a quote that reports only those
 * two can never sum to the shares actually minted. On an atom it is `atomWalletDepositFee` applied
 * to the fee base; on a triple it is `atomDepositFractionForTriple`, waived unless ALL THREE
 * underlying atoms are individually above the fee threshold.
 * @param config MultiVault address and public client.
 * @param inputs The term and the fee base to charge on.
 * @param deps Injectable protocol read primitives.
 * @returns The fee and which kind it is.
 */
export async function multivaultQuoteTermDepositFee(
	config: ReadConfig,
	inputs: { termId: Hex; feeBaseAssets: bigint },
	deps: MultiVaultDepositFeeBaseDeps & MultiVaultTermFeeDeps = {
		...defaultDepositFeeBaseDeps,
		...defaultTermFeeDeps,
	}
): Promise<{ kind: 'atom-wallet' | 'atom-deposit-fraction'; fee: bigint; waived: boolean }> {
	const { termId, feeBaseAssets } = inputs;

	if (await deps.isTriple(config, { args: [termId] })) {
		const [underlying, fraction] = await Promise.all([
			deps.getTriple(config, { args: [termId] }),
			deps.atomDepositFractionAmount(config, { args: [feeBaseAssets] }),
		]);
		const atomIds = underlying as unknown as readonly Hex[];
		const charged = await Promise.all(
			atomIds.map((atomId) => multivaultWillChargeEntryFee(config, { termId: atomId }, deps))
		);
		const waived = charged.some((chargedForAtom) => !chargedForAtom);
		return { kind: 'atom-deposit-fraction', fee: waived ? 0n : fraction, waived };
	}

	const [atomConfig, generalConfig] = await Promise.all([
		deps.getAtomConfig(config),
		deps.getGeneralConfig(config),
	]);
	const atomWalletDepositFee = (
		Array.isArray(atomConfig)
			? atomConfig[1]
			: (atomConfig as { atomWalletDepositFee?: bigint }).atomWalletDepositFee
	) as bigint | undefined;

	if (typeof atomWalletDepositFee !== 'bigint') {
		throw new Error('Unable to resolve atomWalletDepositFee from the MultiVault atom config.');
	}

	const { feeDenominator } = multiVaultResolveGeneralConfig(generalConfig);
	return {
		kind: 'atom-wallet',
		fee: feeOnRaw(feeBaseAssets, atomWalletDepositFee, feeDenominator),
		waived: false,
	};
}

/**
 * Whether MultiVault will charge its entry fee on a deposit into this term.
 *
 * Waived while the DEFAULT curve's vault holds fewer shares than `feeThreshold`: fees are routed
 * into that vault, and donating them into a near-empty share supply would move its price. A quote
 * that assumes the fee always applies overstates it.
 * @param config MultiVault address and public client.
 * @param inputs The term being deposited into.
 * @returns True if the entry fee applies.
 */
export async function multivaultWillChargeEntryFee(
	config: ReadConfig,
	inputs: { termId: Hex },
	deps: MultiVaultFeeContextDeps = defaultFeeContextDeps
): Promise<boolean> {
	const [bondingCurveConfig, generalConfig] = await Promise.all([
		deps.getBondingCurveConfig(config),
		deps.getGeneralConfig(config),
	]);
	const defaultCurveId = multiVaultResolveDefaultCurveId(bondingCurveConfig);
	const { feeThreshold } = multiVaultResolveGeneralConfig(generalConfig);

	const defaultVault = await deps.getVault(config, { args: [inputs.termId, defaultCurveId] });
	return multiVaultResolveVaultTotals(defaultVault).totalShares >= feeThreshold;
}

/**
 * Whether MultiVault will charge its exit fee on a redemption.
 *
 * Same threshold as the entry fee, measured on what the default vault would be LEFT with — so
 * whether it applies depends on the size of the redemption, not only on the term.
 * @param config MultiVault address and public client.
 * @param inputs The term, curve and share count being redeemed.
 * @returns True if the exit fee applies.
 */
export async function multivaultWillChargeExitFee(
	config: ReadConfig,
	inputs: { termId: Hex; curveId: bigint; sharesIn: bigint },
	deps: MultiVaultFeeContextDeps = defaultFeeContextDeps
): Promise<boolean> {
	const [bondingCurveConfig, generalConfig] = await Promise.all([
		deps.getBondingCurveConfig(config),
		deps.getGeneralConfig(config),
	]);
	const defaultCurveId = multiVaultResolveDefaultCurveId(bondingCurveConfig);
	const { feeThreshold } = multiVaultResolveGeneralConfig(generalConfig);

	const defaultVault = await deps.getVault(config, { args: [inputs.termId, defaultCurveId] });
	const { totalShares } = multiVaultResolveVaultTotals(defaultVault);
	const remaining = defaultCurveId === inputs.curveId ? totalShares - inputs.sharesIn : totalShares;

	return remaining >= feeThreshold;
}

/**
 * The curve-level withdrawal fee for a specific account, or zero if the curve charges none.
 *
 * Curve-agnostic: it asks the curve whether it has a redeem hook and, if so, quotes it for THIS
 * account. MultiVault's own `previewRedeem` quotes the same hook with the zero address, which on a
 * curve whose rate keys on the holder's entry tier is a different — and for a slippage floor,
 * unusable — number.
 * @param config MultiVault address and public client.
 * @param inputs The term, curve, redeeming account and gross assets.
 * @returns The curve's withdrawal fee for that account, and the curve it was quoted from.
 */
export async function multivaultQuoteCurveRedeemFee(
	config: ReadConfig,
	inputs: { termId: Hex; curveId: bigint; account: Address; assetsBeforeFees: bigint },
	deps: MultiVaultCurveRedeemFeeDeps = defaultCurveRedeemFeeDeps
): Promise<{ curveAddress: Address | null; curveFee: bigint }> {
	const registry = await resolveRegistry(config, deps);
	const curveAddress = await deps.curveAddresses(registry, {
		args: [inputs.curveId],
	});
	const curve: ReadConfig = { address: curveAddress, publicClient: config.publicClient };

	if (!(await deps.hasRedeemFeeHook(curve))) {
		return { curveAddress: null, curveFee: 0n };
	}

	const curveFee = await deps.quoteRedeemFee(curve, {
		args: [inputs.termId, inputs.account, inputs.assetsBeforeFees],
	});
	return { curveAddress, curveFee };
}

export async function multivaultQuoteDepositPlan(
	config: ReadConfig,
	inputs: {
		termId: Hex;
		curveId: bigint;
		assetsIn: bigint;
		slippageBps?: bigint;
	},
	deps: MultiVaultQuoteDeps = defaultQuoteDeps
): Promise<MultiVaultDepositQuotePlan> {
	const { termId, curveId, assetsIn, slippageBps = DEFAULT_SLIPPAGE_BPS } = inputs;

	if (assetsIn <= 0n) {
		throw new Error('assetsIn must be greater than 0.');
	}

	validateSlippageBps(slippageBps);

	/*
	 * The fee components are quoted on the base the contract actually charges on, not on the gross.
	 * They differ on a vault's first deposit, where the min-share bootstrap cost is netted out first,
	 * and the entry fee is waived entirely below `feeThreshold`. `sharesOut` comes from
	 * `previewDeposit` either way, so getting these wrong used to leave the parts disagreeing with
	 * the whole rather than making the whole wrong — which is harder to notice, not easier.
	 */
	const [feeBase, chargesEntryFee] = await Promise.all([
		multivaultResolveDepositFeeBase(config, { termId, curveId, assetsIn }, deps),
		multivaultWillChargeEntryFee(config, { termId }, deps),
	]);
	const termFee = await multivaultQuoteTermDepositFee(
		config,
		{ termId, feeBaseAssets: feeBase.feeBaseAssets },
		deps
	);

	const [previewResult, entryFeeRate, protocolFee, currentSharePrice] = await Promise.all([
		deps.previewDeposit(config, { args: [termId, curveId, assetsIn] }),
		deps.entryFeeAmount(config, { args: [feeBase.feeBaseAssets] }),
		deps.protocolFeeAmount(config, { args: [feeBase.feeBaseAssets] }),
		deps.currentSharePrice(config, { args: [termId, curveId] }),
	]);

	const { sharesOut, assetsAfterFees } = normalizePreviewDepositResult(
		previewResult as PreviewDepositTuple
	);
	const minSharesOut = applySlippageFloor(sharesOut, slippageBps);

	return {
		termId,
		curveId,
		assetsIn,
		feeBaseAssets: feeBase.feeBaseAssets,
		minShareCost: feeBase.minShareCost,
		isFirstDeposit: feeBase.isFirstDeposit,
		sharesOut,
		minSharesOut,
		assetsAfterFees,
		entryFee: chargesEntryFee ? entryFeeRate : 0n,
		entryFeeWaived: !chargesEntryFee,
		protocolFee,
		termFee: termFee.fee,
		termFeeKind: termFee.kind,
		termFeeWaived: termFee.waived,
		totalEstimatedFees: assetsIn - assetsAfterFees,
		currentSharePrice,
		effectivePricePerShare: getEffectivePricePerShare(assetsIn, sharesOut),
		slippageBps,
	};
}

/**
 * Prepares a deposit transaction sized against its own quote.
 *
 * MultiVault deposits exactly `msg.value`, so the transaction value IS the deposit: it defaults to
 * `assetsIn`, the amount the quote and its slippage floor were computed for. An explicit `value`
 * is passed through as given.
 * @param config MultiVault address and viem clients.
 * @param inputs Receiver, term, curve, gross assets, optional slippage and optional explicit value.
 * @param deps Injectable protocol read primitives.
 * @returns The deposit calldata, args, the value to send with it, and the quote it was built from.
 */
export async function multivaultPrepareDepositTx(
	config: WriteConfig,
	inputs: {
		receiver: Address;
		termId: Hex;
		curveId: bigint;
		assetsIn: bigint;
		slippageBps?: bigint;
		value?: bigint;
	},
	deps: MultiVaultQuoteDeps = defaultQuoteDeps
): Promise<MultiVaultPrepareDepositTxResult> {
	const { receiver, termId, curveId, assetsIn, slippageBps } = inputs;
	const value = inputs.value ?? assetsIn;
	const quote = await multivaultQuoteDepositPlan(
		config,
		{ termId, curveId, assetsIn, slippageBps },
		deps
	);

	const args = [receiver, termId, curveId, quote.minSharesOut] as const;
	const calldata = multiVaultDepositEncode(receiver, termId, curveId, quote.minSharesOut);

	return {
		args,
		calldata,
		value,
		quote,
	};
}

export async function multivaultGetUserPositionSnapshot(
	config: ReadConfig,
	inputs: {
		account: Address;
		termId: Hex;
		curveId: bigint;
		includeUtilization?: boolean;
	},
	deps: MultiVaultPositionDeps = defaultPositionDeps
): Promise<MultiVaultUserPositionSnapshot> {
	const { account, termId, curveId, includeUtilization = false } = inputs;

	const [shares, maxRedeemShares, currentSharePrice, vaultRaw] = await Promise.all([
		deps.getShares(config, { args: [account, termId, curveId] }),
		deps.maxRedeem(config, { args: [account, termId, curveId] }),
		deps.currentSharePrice(config, { args: [termId, curveId] }),
		deps.getVault(config, { args: [termId, curveId] }),
	]);

	const [estimatedAssetsForCurrentShares, estimatedAssetsForMaxRedeem] = await Promise.all([
		deps.convertToAssets(config, { args: [termId, curveId, shares] }),
		deps.convertToAssets(config, { args: [termId, curveId, maxRedeemShares] }),
	]);

	const { totalAssets, totalShares } = multiVaultResolveVaultTotals(vaultRaw);

	if (!includeUtilization) {
		return {
			account,
			termId,
			curveId,
			shares,
			maxRedeemShares,
			estimatedAssetsForCurrentShares,
			estimatedAssetsForMaxRedeem,
			currentSharePrice,
			vaultTotalAssets: totalAssets,
			vaultTotalShares: totalShares,
		};
	}

	const epoch = await deps.currentEpoch(config);
	const [totalForEpoch, userForEpoch, userInEpoch] = await Promise.all([
		deps.getTotalUtilizationForEpoch(config, { args: [epoch] }),
		deps.getUserUtilizationForEpoch(config, { args: [account, epoch] }),
		deps.getUserUtilizationInEpoch(config, { args: [account, epoch] }),
	]);

	return {
		account,
		termId,
		curveId,
		shares,
		maxRedeemShares,
		estimatedAssetsForCurrentShares,
		estimatedAssetsForMaxRedeem,
		currentSharePrice,
		vaultTotalAssets: totalAssets,
		vaultTotalShares: totalShares,
		utilization: {
			epoch,
			totalForEpoch,
			userForEpoch,
			userInEpoch,
		},
	};
}

/**
 * Quotes what a SPECIFIC account receives for redeeming shares, and the floor to send with it.
 *
 * `account` is required, and that is the point. MultiVault's `previewRedeem` quotes any curve redeem
 * hook with the zero address, so on a curve whose withdrawal rate keys on where the holder entered
 * it returns a number that belongs to no one — and a `minAssets` derived from it is wrong in both
 * directions: too loose when it understates the payout, and unmeetable (the redeem reverts) when it
 * overstates it. This composes the payout from parts that each know who is asking: MultiVault's
 * gross conversion, its protocol fee, its exit fee where that fee actually applies, and the curve's
 * own account-aware quote.
 * @param config MultiVault address and public client.
 * @param inputs The term, curve, redeeming account, share count and optional slippage.
 * @param deps Injectable protocol read primitives.
 * @returns The account's payout, its fee breakdown, and a slippage floor derived from it.
 */
export async function multivaultQuoteRedeemPlan(
	config: ReadConfig,
	inputs: {
		termId: Hex;
		curveId: bigint;
		account: Address;
		sharesIn: bigint;
		slippageBps?: bigint;
	},
	deps: MultiVaultRedeemQuoteDeps = defaultRedeemQuoteDeps
): Promise<MultiVaultRedeemQuotePlan> {
	const { termId, curveId, account, sharesIn, slippageBps = DEFAULT_SLIPPAGE_BPS } = inputs;

	if (sharesIn <= 0n) {
		throw new Error('sharesIn must be greater than 0.');
	}

	validateSlippageBps(slippageBps);

	const [assetsBeforeFees, currentSharePrice] = await Promise.all([
		deps.convertToAssets(config, { args: [termId, curveId, sharesIn] }),
		deps.currentSharePrice(config, { args: [termId, curveId] }),
	]);

	const [protocolFee, exitFeeRate, chargesExitFee, curveQuote] = await Promise.all([
		deps.protocolFeeAmount(config, { args: [assetsBeforeFees] }),
		deps.exitFeeAmount(config, { args: [assetsBeforeFees] }),
		multivaultWillChargeExitFee(config, { termId, curveId, sharesIn }, deps),
		multivaultQuoteCurveRedeemFee(config, { termId, curveId, account, assetsBeforeFees }, deps),
	]);

	const exitFee = chargesExitFee ? exitFeeRate : 0n;
	const totalEstimatedFees = protocolFee + exitFee + curveQuote.curveFee;

	if (totalEstimatedFees >= assetsBeforeFees) {
		throw new Error('Fees would consume the whole redemption; MultiVault would revert.');
	}

	const assetsOut = assetsBeforeFees - totalEstimatedFees;

	return {
		termId,
		curveId,
		account,
		sharesIn,
		sharesUsed: sharesIn,
		assetsBeforeFees,
		assetsOut,
		minAssetsOut: applySlippageFloor(assetsOut, slippageBps),
		exitFee,
		exitFeeWaived: !chargesExitFee,
		protocolFee,
		curveFee: curveQuote.curveFee,
		curveAddress: curveQuote.curveAddress,
		totalEstimatedFees,
		currentSharePrice,
		effectivePricePerShare: getEffectivePricePerShare(assetsOut, sharesIn),
		slippageBps,
	};
}

/**
 * Prepares a redeem transaction for a specific account, sized against its own quote.
 * @param config MultiVault address and viem clients.
 * @param inputs Receiver, term, curve, redeeming account, share count and optional slippage.
 * @param deps Injectable protocol read primitives.
 * @returns The redeem calldata, args, and the quote it was built from.
 */
export async function multivaultPrepareRedeemTx(
	config: WriteConfig,
	inputs: {
		receiver: Address;
		termId: Hex;
		curveId: bigint;
		account: Address;
		sharesIn: bigint;
		slippageBps?: bigint;
	},
	deps: MultiVaultRedeemQuoteDeps = defaultRedeemQuoteDeps
): Promise<MultiVaultPrepareRedeemTxResult> {
	const { receiver, termId, curveId, account, sharesIn, slippageBps } = inputs;

	const quote = await multivaultQuoteRedeemPlan(
		config,
		{ termId, curveId, account, sharesIn, slippageBps },
		deps
	);

	const args = [receiver, termId, curveId, sharesIn, quote.minAssetsOut] as const;
	const calldata = multiVaultRedeemEncode(receiver, termId, curveId, sharesIn, quote.minAssetsOut);

	return {
		args,
		calldata,
		quote,
	};
}

export async function multivaultCreateAndSeedTerm(
	config: WriteConfig,
	inputs: {
		receiver: Address;
		atomsToCreate?: MultiVaultCreateAtomInput[];
		triplesToCreate?: MultiVaultCreateTripleInput[];
		seedDeposits?: MultiVaultSeedDepositInput[];
	},
	deps: MultiVaultCreateAndSeedDeps = defaultCreateAndSeedDeps
): Promise<MultiVaultCreateAndSeedTermPlan> {
	const { receiver, atomsToCreate = [], triplesToCreate = [], seedDeposits = [] } = inputs;

	if (atomsToCreate.length === 0 && triplesToCreate.length === 0 && seedDeposits.length === 0) {
		throw new Error('At least one create or seed action is required.');
	}

	const steps: MultiVaultCreateAndSeedStep[] = [];

	const createAtomPreviews = await Promise.all(
		atomsToCreate.map(async (atom) => {
			if (atom.assetsIn <= 0n) {
				throw new Error('Atom creation assets must be greater than 0.');
			}

			const preview = await deps.previewAtomCreate(config, {
				args: [atom.termId, atom.assetsIn],
			});
			const normalized = normalizePreviewCreateResult(preview as PreviewCreateTuple);

			return {
				termId: atom.termId,
				assetsIn: atom.assetsIn,
				sharesOut: normalized.sharesOut,
				feeBaseAssets: normalized.feeBaseAssets,
				assetsAfterFees: normalized.assetsAfterFees,
			};
		})
	);

	if (atomsToCreate.length > 0) {
		const calldata = multiVaultCreateAtomsEncode(
			atomsToCreate.map((atom) => atom.data),
			atomsToCreate.map((atom) => atom.assetsIn)
		);
		steps.push({
			type: 'create-atoms',
			calldata,
			value: sumBigints(atomsToCreate.map((atom) => atom.assetsIn)),
		});
	}

	const createTriplePreviews = await Promise.all(
		triplesToCreate.map(async (triple) => {
			if (triple.assetsIn <= 0n) {
				throw new Error('Triple creation assets must be greater than 0.');
			}

			const preview = await deps.previewTripleCreate(config, {
				args: [triple.subjectId, triple.predicateId, triple.objectId, triple.assetsIn],
			});
			const normalized = normalizePreviewCreateResult(preview as PreviewCreateTuple);

			return {
				termId: triple.termId,
				assetsIn: triple.assetsIn,
				sharesOut: normalized.sharesOut,
				feeBaseAssets: normalized.feeBaseAssets,
				assetsAfterFees: normalized.assetsAfterFees,
			};
		})
	);

	if (triplesToCreate.length > 0) {
		const calldata = multiVaultCreateTriplesEncode(
			triplesToCreate.map((triple) => triple.subjectId),
			triplesToCreate.map((triple) => triple.predicateId),
			triplesToCreate.map((triple) => triple.objectId),
			triplesToCreate.map((triple) => triple.assetsIn)
		);
		steps.push({
			type: 'create-triples',
			calldata,
			value: sumBigints(triplesToCreate.map((triple) => triple.assetsIn)),
		});
	}

	const seedDepositQuotes = await Promise.all(
		seedDeposits.map((seed) =>
			multivaultQuoteDepositPlan(
				config,
				{
					termId: seed.termId,
					curveId: seed.curveId,
					assetsIn: seed.assetsIn,
					slippageBps: seed.slippageBps,
				},
				deps
			)
		)
	);

	if (seedDeposits.length > 0) {
		const calldata = multiVaultDepositBatchEncode(
			receiver,
			seedDeposits.map((seed) => seed.termId),
			seedDeposits.map((seed) => seed.curveId),
			seedDeposits.map((seed) => seed.assetsIn),
			seedDepositQuotes.map((quote) => quote.minSharesOut)
		);
		steps.push({
			type: 'deposit-batch',
			calldata,
			value: sumBigints(seedDeposits.map((seed) => seed.assetsIn)),
		});
	}

	const totalValue = sumBigints(
		steps.map((step) => step.value).filter((value): value is bigint => typeof value === 'bigint')
	);

	return {
		receiver,
		createAtomPreviews,
		createTriplePreviews,
		seedDepositQuotes,
		steps,
		totalValue,
	};
}

export async function multivaultGetUtilizationAnalyticsBundle(
	config: ReadConfig,
	inputs: {
		account?: Address;
		startEpoch?: bigint;
		endEpoch?: bigint;
	},
	deps: MultiVaultUtilizationDeps = defaultUtilizationDeps
): Promise<MultiVaultUtilizationAnalyticsBundle> {
	const { account, startEpoch, endEpoch } = inputs;
	const currentEpoch = await deps.currentEpoch(config);
	const range = resolveRange(startEpoch, endEpoch, currentEpoch);
	const epochs = getEpochsInRange(range.startEpoch, range.endEpoch);

	const points = await Promise.all(
		epochs.map(async (epoch) => {
			const totalForEpoch = await deps.getTotalUtilizationForEpoch(config, { args: [epoch] });

			if (!account) {
				const point: MultiVaultUtilizationEpochPoint = {
					epoch,
					totalForEpoch,
					deltaFromPreviousTotal: null,
				};
				return point;
			}

			const [userForEpoch, userInEpoch] = await Promise.all([
				deps.getUserUtilizationForEpoch(config, { args: [account, epoch] }),
				getUserUtilizationInEpochSafe(deps, config, account, epoch),
			]);

			const point: MultiVaultUtilizationEpochPoint = {
				epoch,
				totalForEpoch,
				deltaFromPreviousTotal: null,
				userForEpoch,
				userInEpoch,
				deltaFromPreviousUser: null,
			};
			return point;
		})
	);

	let previousTotal: bigint | null = null;
	let previousUser: bigint | null = null;
	for (const point of points) {
		point.deltaFromPreviousTotal =
			previousTotal === null ? null : point.totalForEpoch - previousTotal;
		previousTotal = point.totalForEpoch;

		if (typeof point.userForEpoch === 'bigint') {
			point.deltaFromPreviousUser =
				previousUser === null ? null : point.userForEpoch - previousUser;
			previousUser = point.userForEpoch;
		}
	}

	const aggregateTotalUtilization = sumBigints(points.map((point) => point.totalForEpoch));
	const aggregateUserUtilization =
		account == null
			? undefined
			: sumBigints(
					points
						.map((point) => point.userForEpoch)
						.filter((value): value is bigint => typeof value === 'bigint')
				);
	const lastActiveEpoch =
		account == null ? undefined : await deps.getUserLastActiveEpoch(config, { args: [account] });

	return {
		startEpoch: range.startEpoch,
		endEpoch: range.endEpoch,
		currentEpoch,
		account,
		lastActiveEpoch,
		aggregateTotalUtilization,
		aggregateUserUtilization,
		points,
	};
}

export type MultiVaultOnBehalfOfAtomInput = { data: Hex; assets: bigint };
export type MultiVaultOnBehalfOfTripleInput = {
	subjectId: Hex;
	predicateId: Hex;
	objectId: Hex;
	assets: bigint;
};

export type MultiVaultOnBehalfOfCreationStep = {
	type: 'approve' | 'create-atoms-for' | 'create-triples-for';
	// The account that must sign this step. The approval leg is signed by `creator`
	// (granting `caller` CREATION approval); the creation legs are signed by `caller`.
	signer: 'creator' | 'caller';
	calldata: Hex;
	value?: bigint;
};

export type MultiVaultOnBehalfOfCreationPlan = {
	creator: Address;
	caller: Address;
	approvalAlreadyGranted: boolean;
	steps: MultiVaultOnBehalfOfCreationStep[];
};

type MultiVaultOnBehalfOfCreationDeps = {
	isApprovedToCreate: typeof multiVaultIsApprovedToCreate;
	isApprovedToDeposit: typeof multiVaultIsApprovedToDeposit;
	isApprovedToRedeem: typeof multiVaultIsApprovedToRedeem;
};

const defaultOnBehalfOfCreationDeps: MultiVaultOnBehalfOfCreationDeps = {
	isApprovedToCreate: multiVaultIsApprovedToCreate,
	isApprovedToDeposit: multiVaultIsApprovedToDeposit,
	isApprovedToRedeem: multiVaultIsApprovedToRedeem,
};

/**
 * Combines the three independently-readable approval bits into the single bitmask
 * `MultiVault.approve` expects. Required because `approve` REPLACES the caller's entire
 * approval bitmask rather than adding a bit — writing `ApprovalTypes.CREATION` alone would
 * silently revoke any DEPOSIT/REDEMPTION approval the creator had already granted.
 */
function combineApprovalTypes(
	hasDeposit: boolean,
	hasRedemption: boolean,
	hasCreation: boolean
): ApprovalTypes {
	const bits =
		(hasDeposit ? ApprovalTypes.DEPOSIT : 0) |
		(hasRedemption ? ApprovalTypes.REDEMPTION : 0) |
		(hasCreation ? ApprovalTypes.CREATION : 0);
	return bits as ApprovalTypes;
}

/**
 * Prepares an on-behalf-of creation plan: `createAtomsFor` / `createTriplesFor` require
 * `creator` to have granted `caller` CREATION approval first, so this reads that
 * approval state and — if missing — prepends the `approve` calldata as its own step.
 * The approval step and the creation steps have DIFFERENT required signers
 * (`creator` vs `caller`); the caller of this function is responsible for routing each
 * step to the right signer, in order.
 * @param config Read config for MultiVault.
 * @param inputs The creator being created for, the caller acting on their behalf, and the atoms/triples to create.
 * @param deps Injectable protocol read primitives.
 * @returns The ordered steps (approval, if needed, then creation) and whether approval was already in place.
 */
export async function multivaultPrepareOnBehalfOfCreationPlan(
	config: ReadConfig,
	inputs: {
		creator: Address;
		caller: Address;
		atoms?: MultiVaultOnBehalfOfAtomInput[];
		triples?: MultiVaultOnBehalfOfTripleInput[];
	},
	deps: MultiVaultOnBehalfOfCreationDeps = defaultOnBehalfOfCreationDeps
): Promise<MultiVaultOnBehalfOfCreationPlan> {
	const { creator, caller, atoms = [], triples = [] } = inputs;

	if (atoms.length === 0 && triples.length === 0) {
		throw new Error('At least one atom or triple creation is required.');
	}

	if (creator === caller) {
		throw new Error(
			'creator === caller needs no approval — use createAtoms/createTriples directly, not the on-behalf-of variants.'
		);
	}

	const [hasDeposit, hasRedemption, approvalAlreadyGranted] = await Promise.all([
		deps.isApprovedToDeposit(config, { args: [caller, creator] }),
		deps.isApprovedToRedeem(config, { args: [caller, creator] }),
		deps.isApprovedToCreate(config, { args: [caller, creator] }),
	]);

	const steps: MultiVaultOnBehalfOfCreationStep[] = [];

	if (!approvalAlreadyGranted) {
		steps.push({
			type: 'approve',
			signer: 'creator',
			// Preserves any existing DEPOSIT/REDEMPTION approval instead of clobbering it —
			// `approve` replaces the full bitmask, it doesn't add a bit.
			calldata: multiVaultApproveEncode(
				caller,
				combineApprovalTypes(hasDeposit, hasRedemption, true)
			),
		});
	}

	if (atoms.length > 0) {
		steps.push({
			type: 'create-atoms-for',
			signer: 'caller',
			calldata: multiVaultCreateAtomsForEncode(
				creator,
				atoms.map((atom) => atom.data),
				atoms.map((atom) => atom.assets)
			),
			value: sumBigints(atoms.map((atom) => atom.assets)),
		});
	}

	if (triples.length > 0) {
		steps.push({
			type: 'create-triples-for',
			signer: 'caller',
			calldata: multiVaultCreateTriplesForEncode(
				creator,
				triples.map((triple) => triple.subjectId),
				triples.map((triple) => triple.predicateId),
				triples.map((triple) => triple.objectId),
				triples.map((triple) => triple.assets)
			),
			value: sumBigints(triples.map((triple) => triple.assets)),
		});
	}

	return { creator, caller, approvalAlreadyGranted, steps };
}

export type MultiVaultMulticallSubCall = {
	calldata: Hex;
	value: bigint;
};

export type MultiVaultPrepareMulticallTxResult = {
	args: readonly [readonly Hex[], readonly bigint[]];
	calldata: Hex;
	value: bigint;
};

/**
 * Assembles a consolidated payable `multicall` batch: the `bytes[]` sub-call array and
 * the `uint256[]` per-sub-call value array must stay aligned and their values must sum
 * to exactly `msg.value` — the fiddliest part of building this call by hand.
 * @param subCalls The sub-calls to batch, each with its own calldata and value allocation.
 * @returns The `multicall` calldata, args, and the total value the batch requires.
 */
export function multivaultPrepareMulticallTx(
	subCalls: MultiVaultMulticallSubCall[]
): MultiVaultPrepareMulticallTxResult {
	if (subCalls.length === 0) {
		throw new Error('At least one sub-call is required.');
	}

	const data = subCalls.map((subCall) => subCall.calldata);
	const values = subCalls.map((subCall) => subCall.value);
	const value = sumBigints(values);

	const args = [data, values] as const;
	const calldata = multiVaultMulticallEncode(data, values);

	return { args, calldata, value };
}

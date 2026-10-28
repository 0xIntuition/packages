/**
 * Shared harness for the dynamic-fee curve integration checks.
 *
 * Every trade goes through MultiVault on the curve deployed by `deployDynamicFeeCurve`. Before each
 * trade the harness reads the curve's on-chain state back, runs the `@0xintuition/curves` replica
 * against it, and records both sides so a test can compare them to the wei. Nothing here asserts;
 * the tests do, one property per `it`.
 */
import {
	DYNAMIC_FEE_ACC_PRECISION,
	type DynamicFeeConfig,
	type DynamicFeeDepositBand,
	type DynamicFeeDepositDistribution,
	type DynamicFeeLots,
	type DynamicFeeRedeemDistribution,
	type DynamicFeeRedeemLotCharge,
	dynamicFeeDistributeDeposit,
	dynamicFeeDistributeRedeem,
	dynamicFeeQuoteDepositBands,
	dynamicFeeQuoteRedeemFee,
	dynamicFeeQuoteRedeemFeeLots,
	dynamicFeeTierOf,
	feeOnRaw,
} from '@0xintuition/curves';
import {
	type Address,
	createWalletClient,
	type Hex,
	http,
	parseEventLogs,
	type TransactionReceipt,
	toHex,
	type WalletClient,
	zeroAddress,
} from 'viem';
import {
	bondingCurveRegistryPreviewMint,
	dynamicFeeFlatPriceCurveAccFeePerShare,
	dynamicFeeFlatPriceCurveBankedEarnings,
	dynamicFeeFlatPriceCurveGetConfig,
	dynamicFeeFlatPriceCurveLotRewardDebt,
	dynamicFeeFlatPriceCurvePendingFor,
	dynamicFeeFlatPriceCurvePreviewRedeemFor,
	dynamicFeeFlatPriceCurveProtocolAccrued,
	dynamicFeeFlatPriceCurveQuoteDepositFee,
	dynamicFeeFlatPriceCurveQuoteRedeemFee,
	dynamicFeeFlatPriceCurveTierStake,
	dynamicFeeFlatPriceCurveUserLots,
	dynamicFeeFlatPriceCurveUserStake,
	dynamicFeeFlatPriceCurveUserTopTier,
	dynamicFeeFlatPriceCurveVaultStake,
	eventParseDepositBandRecorded,
	eventParseDepositRecorded,
	multiVaultAccumulatedAtomWalletDepositFees,
	multiVaultAccumulatedProtocolFees,
	multiVaultCalculateAtomId,
	multiVaultComputeAtomWalletAddr,
	multiVaultConvertToAssets,
	multiVaultCreateAtoms,
	multiVaultCurrentEpoch,
	multiVaultDeposit,
	multiVaultGetAtomConfig,
	multiVaultGetAtomCost,
	multiVaultGetGeneralConfig,
	multiVaultGetShares,
	multiVaultGetVault,
	multiVaultGetVaultFees,
	multiVaultPreviewDeposit,
	multiVaultPreviewRedeem,
	multiVaultRedeem,
	multiVaultResolveGeneralConfig,
	multiVaultResolveVaultTotals,
	type ReadConfig,
} from '../../src';
import { DynamicFeeFlatPriceCurveAbi, MultiVaultAbi } from '../../src/contracts';
import { ACCOUNTS } from './constants';
import { type DynamicFeeCurveDeployment, deployDynamicFeeCurve } from './deploy-dynamic-fee-curve';
import { anvil, publicClient, testClient, walletClient } from './utils';

export const ACC = DYNAMIC_FEE_ACC_PRECISION;
export const DEFAULT_CURVE_ID = 1n;

export type Actor = { address: Address; wallet: WalletClient };

export type DynamicFeeContext = DynamicFeeCurveDeployment & {
	config: DynamicFeeConfig;
	multiVault: ReadConfig;
	curve: ReadConfig;
	registry: ReadConfig;
	minShare: bigint;
	feeThreshold: bigint;
	feeDenominator: bigint;
	entryFee: bigint;
	exitFee: bigint;
	protocolFee: bigint;
	atomWalletDepositFee: bigint;
	atomCost: bigint;
};

export async function loadDynamicFeeContext(): Promise<DynamicFeeContext> {
	const deployment = await deployDynamicFeeCurve();
	const multiVault: ReadConfig = { address: deployment.core.intuition.multiVault, publicClient };
	const curve: ReadConfig = { address: deployment.curveAddress, publicClient };
	const registry: ReadConfig = {
		address: deployment.core.intuition.bondingCurveRegistry,
		publicClient,
	};

	const [config, generalConfig, vaultFees, atomConfig, atomCost] = await Promise.all([
		dynamicFeeFlatPriceCurveGetConfig(curve),
		multiVaultGetGeneralConfig(multiVault),
		multiVaultGetVaultFees(multiVault),
		multiVaultGetAtomConfig(multiVault),
		multiVaultGetAtomCost(multiVault),
	]);
	const { minShare, feeThreshold, feeDenominator } = multiVaultResolveGeneralConfig(generalConfig);

	return {
		...deployment,
		config,
		multiVault,
		curve,
		registry,
		minShare,
		feeThreshold,
		feeDenominator,
		entryFee: vaultFees.entryFee,
		exitFee: vaultFees.exitFee,
		protocolFee: vaultFees.protocolFee,
		atomWalletDepositFee: atomConfig.atomWalletDepositFee,
		atomCost,
	};
}

/** A JSON-RPC signer for one of anvil's prefunded accounts, topped up to `balance`. */
export async function fundedActor(index: number, balance: bigint): Promise<Actor> {
	const address = ACCOUNTS[index] as Address;
	await testClient.setBalance({ address, value: balance });
	return {
		address,
		wallet: createWalletClient({ chain: anvil, transport: http(), account: address }),
	};
}

export async function waitForSuccess(hash: Hex): Promise<TransactionReceipt> {
	const receipt = await publicClient.waitForTransactionReceipt({ hash });
	if (receipt.status !== 'success') {
		throw new Error(`transaction ${hash} reverted`);
	}
	return receipt;
}

export function gasCost(receipt: TransactionReceipt): bigint {
	return receipt.gasUsed * receipt.effectiveGasPrice;
}

/**
 * Creates a fresh atom. `extraAssets` above the atom cost seeds the DEFAULT curve's vault; at two
 * TRUST that vault clears the 1-TRUST `feeThreshold`, so later deposits pay the entry fee. Pass
 * `0n` for an atom whose entry and exit fees stay waived.
 */
export async function createAtom(
	ctx: DynamicFeeContext,
	label: string,
	extraAssets = 2n * 10n ** 18n
): Promise<Hex> {
	const data = toHex(`${label} ${Math.random()}`);
	const termId = await multiVaultCalculateAtomId(ctx.multiVault, { args: [data] });
	const assets = ctx.atomCost + extraAssets;
	await waitForSuccess(
		await multiVaultCreateAtoms(
			{ address: ctx.multiVault.address, walletClient, publicClient },
			{ args: [[data], [assets]], value: assets }
		)
	);
	return termId;
}

/* ================================ on-chain state ================================ */

export type CurveSnapshot = {
	vaultStake: bigint;
	/** `tierStake[termId][tier]`, every tier, indexed by tier. */
	tierStake: bigint[];
	/** `accFeePerShare[termId][tier]`, every tier, indexed by tier. */
	accFeePerShare: bigint[];
	protocolAccrued: bigint;
};

export type AccountSnapshot = {
	/** The account's lots with their stored reward debts, as the replica takes them. */
	lots: DynamicFeeLots;
	/** `userLots` as the contract returns it, highest tier first. */
	lotTiers: bigint[];
	lotStakes: bigint[];
	topTier: bigint;
	pending: bigint;
	banked: bigint;
	userStake: bigint;
	shares: bigint;
};

export async function readCurve(ctx: DynamicFeeContext, termId: Hex): Promise<CurveSnapshot> {
	const tiers = Array.from({ length: Number(ctx.config.tierCount) }, (_, index) => BigInt(index));
	const [vaultStake, tierStake, accFeePerShare, protocolAccrued] = await Promise.all([
		dynamicFeeFlatPriceCurveVaultStake(ctx.curve, { args: [termId] }),
		Promise.all(
			tiers.map((tier) => dynamicFeeFlatPriceCurveTierStake(ctx.curve, { args: [termId, tier] }))
		),
		Promise.all(
			tiers.map((tier) =>
				dynamicFeeFlatPriceCurveAccFeePerShare(ctx.curve, { args: [termId, tier] })
			)
		),
		dynamicFeeFlatPriceCurveProtocolAccrued(ctx.curve),
	]);
	return { vaultStake, tierStake, accFeePerShare, protocolAccrued };
}

export async function readAccount(
	ctx: DynamicFeeContext,
	termId: Hex,
	account: Address
): Promise<AccountSnapshot> {
	const [userLots, topTier, pending, banked, userStake, shares] = await Promise.all([
		dynamicFeeFlatPriceCurveUserLots(ctx.curve, { args: [termId, account] }),
		dynamicFeeFlatPriceCurveUserTopTier(ctx.curve, { args: [termId, account] }),
		dynamicFeeFlatPriceCurvePendingFor(ctx.curve, { args: [account, termId] }),
		dynamicFeeFlatPriceCurveBankedEarnings(ctx.curve, { args: [account] }),
		dynamicFeeFlatPriceCurveUserStake(ctx.curve, { args: [termId, account] }),
		multiVaultGetShares(ctx.multiVault, { args: [account, termId, ctx.curveId] }),
	]);
	const [lotTiers, lotStakes] = userLots;
	const debts = await Promise.all(
		lotTiers.map((tier) =>
			dynamicFeeFlatPriceCurveLotRewardDebt(ctx.curve, { args: [termId, account, tier] })
		)
	);
	const lots: DynamicFeeLots = new Map();
	lotTiers.forEach((tier, index) => {
		lots.set(tier, { stake: lotStakes[index] as bigint, rewardDebt: debts[index] as bigint });
	});
	return {
		lots,
		lotTiers: [...lotTiers],
		lotStakes: [...lotStakes],
		topTier,
		pending,
		banked,
		userStake,
		shares,
	};
}

/** Non-zero `tierStake` entries, the shape the replica takes. */
export function occupancyOf(snapshot: CurveSnapshot): Map<bigint, bigint> {
	const occupancy = new Map<bigint, bigint>();
	snapshot.tierStake.forEach((stake, tier) => {
		if (stake > 0n) occupancy.set(BigInt(tier), stake);
	});
	return occupancy;
}

/** Non-zero `accFeePerShare` entries, the shape the replica takes. */
export function accumulatorsOf(snapshot: CurveSnapshot): Map<bigint, bigint> {
	const acc = new Map<bigint, bigint>();
	snapshot.accFeePerShare.forEach((value, tier) => {
		if (value > 0n) acc.set(BigInt(tier), value);
	});
	return acc;
}

/** Expands a replica map back to a dense per-tier array for comparison with on-chain reads. */
export function denseByTier(map: Map<bigint, bigint>, tierCount: bigint): bigint[] {
	return Array.from({ length: Number(tierCount) }, (_, tier) => map.get(BigInt(tier)) ?? 0n);
}

/** `_pendingFor` over a set of lots: `Σ max(0, floor(stake * acc / ACC) - debt)`. */
export function pendingFromLots(lots: DynamicFeeLots, acc: Map<bigint, bigint>): bigint {
	let pending = 0n;
	for (const [tier, lot] of lots) {
		const accumulated = (lot.stake * (acc.get(tier) ?? 0n)) / ACC;
		if (accumulated > lot.rewardDebt) pending += accumulated - lot.rewardDebt;
	}
	return pending;
}

/** Lots as `[tier, stake, rewardDebt]` triples, highest tier first, for structural comparison. */
export function lotTriples(lots: DynamicFeeLots): Array<[bigint, bigint, bigint]> {
	return [...lots.entries()]
		.map(([tier, lot]) => [tier, lot.stake, lot.rewardDebt] as [bigint, bigint, bigint])
		.sort((a, b) => (a[0] > b[0] ? -1 : 1));
}

type VaultTotals = { totalAssets: bigint; totalShares: bigint };

async function readVault(
	ctx: DynamicFeeContext,
	termId: Hex,
	curveId: bigint
): Promise<VaultTotals> {
	return multiVaultResolveVaultTotals(
		await multiVaultGetVault(ctx.multiVault, { args: [termId, curveId] })
	);
}

type Balances = {
	curve: bigint;
	multiVault: bigint;
	protocolFees: bigint;
	atomWalletFees: bigint;
	defaultVault: VaultTotals;
	vault: VaultTotals;
};

async function readBalances(
	ctx: DynamicFeeContext,
	termId: Hex,
	epoch: bigint,
	isAtom = true
): Promise<Balances> {
	const atomWallet = isAtom
		? await multiVaultComputeAtomWalletAddr(ctx.multiVault, { args: [termId] })
		: undefined;
	const [curve, multiVault, protocolFees, atomWalletFees, defaultVault, vault] = await Promise.all([
		publicClient.getBalance({ address: ctx.curveAddress }),
		publicClient.getBalance({ address: ctx.multiVault.address }),
		multiVaultAccumulatedProtocolFees(ctx.multiVault, { args: [epoch] }),
		atomWallet
			? multiVaultAccumulatedAtomWalletDepositFees(ctx.multiVault, { args: [atomWallet] })
			: Promise.resolve(0n),
		readVault(ctx, termId, DEFAULT_CURVE_ID),
		readVault(ctx, termId, ctx.curveId),
	]);
	return { curve, multiVault, protocolFees, atomWalletFees, defaultVault, vault };
}

/* ================================ deposit ================================ */

/**
 * The deposit composed off chain from MultiVault's fee schedule and the curves replica: fee base
 * (gross less the min-share bootstrap on a new vault, doubled for a triple), each MultiVault fee
 * rounded up on that base, the piecewise curve fee, and the 1:1 share mint the flat curve gives.
 * `termFee` is the atom-wallet cut on an atom and the atom-deposit fraction on a triple.
 */
export type ComposedDepositQuote = {
	isNewVault: boolean;
	minShareCost: bigint;
	feeBase: bigint;
	protocolFee: bigint;
	entryFee: bigint;
	termFee: bigint;
	curveFee: bigint;
	bands: DynamicFeeDepositBand[];
	assetsAfterFees: bigint;
	shares: bigint;
	vaultStake: bigint;
};

/** The chain state a deposit quote depends on, read once so a search can price many amounts. */
export type DepositQuoteState = {
	isNewVault: boolean;
	perUnitMinShareCost: bigint;
	chargesEntryFee: boolean;
	vaultStake: bigint;
	/** Set for a triple vault: whether all three atoms clear the fee threshold. */
	triple?: { chargesAtomDepositFraction: boolean; atomDepositFraction: bigint };
};

export async function readDepositQuoteState(
	ctx: DynamicFeeContext,
	termId: Hex,
	triple?: { atomIds: readonly [Hex, Hex, Hex] }
): Promise<DepositQuoteState> {
	const [vault, defaultVault, vaultStake, perUnitMinShareCost] = await Promise.all([
		readVault(ctx, termId, ctx.curveId),
		readVault(ctx, termId, DEFAULT_CURVE_ID),
		dynamicFeeFlatPriceCurveVaultStake(ctx.curve, { args: [termId] }),
		bondingCurveRegistryPreviewMint(ctx.registry, { args: [ctx.minShare, 0n, 0n, ctx.curveId] }),
	]);
	let tripleState: DepositQuoteState['triple'];
	if (triple) {
		const [atomVaults, tripleConfig] = await Promise.all([
			Promise.all(triple.atomIds.map((atomId) => readVault(ctx, atomId, DEFAULT_CURVE_ID))),
			publicClient.readContract({
				address: ctx.multiVault.address,
				abi: MultiVaultAbi,
				functionName: 'getTripleConfig',
			}),
		]);
		tripleState = {
			chargesAtomDepositFraction: atomVaults.every(
				(atomVault) => atomVault.totalShares >= ctx.feeThreshold
			),
			atomDepositFraction: tripleConfig.atomDepositFractionForTriple,
		};
	}
	return {
		isNewVault: vault.totalShares === 0n,
		perUnitMinShareCost,
		chargesEntryFee: defaultVault.totalShares >= ctx.feeThreshold,
		vaultStake,
		triple: tripleState,
	};
}

export function composeDepositQuote(
	ctx: DynamicFeeContext,
	state: DepositQuoteState,
	assets: bigint
): ComposedDepositQuote {
	const minShareCost = state.isNewVault ? state.perUnitMinShareCost * (state.triple ? 2n : 1n) : 0n;
	const feeBase = assets - minShareCost;
	const protocolFee = feeOnRaw(feeBase, ctx.protocolFee, ctx.feeDenominator);
	const entryFee = state.chargesEntryFee ? feeOnRaw(feeBase, ctx.entryFee, ctx.feeDenominator) : 0n;
	let termFee = feeOnRaw(feeBase, ctx.atomWalletDepositFee, ctx.feeDenominator);
	if (state.triple) {
		termFee = state.triple.chargesAtomDepositFraction
			? feeOnRaw(feeBase, state.triple.atomDepositFraction, ctx.feeDenominator)
			: 0n;
	}
	const bands = dynamicFeeQuoteDepositBands(state.vaultStake, feeBase, ctx.config);
	const curveFee = bands.reduce((sum, band) => sum + band.fee, 0n);
	const assetsAfterFees = feeBase - protocolFee - entryFee - termFee - curveFee;
	return {
		isNewVault: state.isNewVault,
		minShareCost,
		feeBase,
		protocolFee,
		entryFee,
		termFee,
		curveFee,
		bands,
		assetsAfterFees,
		shares: assetsAfterFees,
		vaultStake: state.vaultStake,
	};
}

/**
 * The smallest gross deposit whose minted shares are exactly `targetShares`, or `undefined` if the
 * per-wei rounding of the fees skips that value. Searched off chain; the caller confirms the result
 * against `previewDeposit` before sending it.
 */
export async function findAssetsForShares(
	ctx: DynamicFeeContext,
	termId: Hex,
	targetShares: bigint
): Promise<bigint | undefined> {
	const state = await readDepositQuoteState(ctx, termId);
	let low = targetShares;
	let high = targetShares * 2n;
	while (low < high) {
		const mid = (low + high) / 2n;
		if (composeDepositQuote(ctx, state, mid).shares < targetShares) {
			low = mid + 1n;
		} else {
			high = mid;
		}
	}
	// The share count is not monotonic at wei scale (four round-ups), so scan around the boundary.
	for (let assets = low - 64n; assets <= low + 64n; assets++) {
		if (composeDepositQuote(ctx, state, assets).shares === targetShares) return assets;
	}
	return undefined;
}

export type DepositRun = {
	termId: Hex;
	actor: Actor;
	assets: bigint;
	epoch: bigint;
	before: CurveSnapshot;
	after: CurveSnapshot;
	actorBefore: AccountSnapshot;
	actorAfter: AccountSnapshot;
	holdersBefore: Map<Address, AccountSnapshot>;
	holdersAfter: Map<Address, AccountSnapshot>;
	composed: ComposedDepositQuote;
	onchainQuoteFee: bigint;
	preview: { shares: bigint; assetsAfterFees: bigint };
	replica: DynamicFeeDepositDistribution;
	receipt: TransactionReceipt;
	bandEvents: Array<{ tier: bigint; stake: bigint; fee: bigint }>;
	recorded: { shares: bigint; fee: bigint; sourceTier: bigint; topTier: bigint };
	deposited: { assets: bigint; assetsAfterFees: bigint; shares: bigint };
	balancesBefore: Balances;
	balancesAfter: Balances;
};

/**
 * Quotes, replays and executes one deposit into an atom vault on the dynamic-fee curve, with the
 * slippage floor set to the previewed share count exactly — so an over-quote reverts the trade.
 */
export async function runDeposit(
	ctx: DynamicFeeContext,
	actor: Actor,
	termId: Hex,
	assets: bigint,
	options: { holders?: Address[]; triple?: { atomIds: readonly [Hex, Hex, Hex] } } = {}
): Promise<DepositRun> {
	const holders = options.holders ?? [];
	const epoch = await multiVaultCurrentEpoch(ctx.multiVault);
	const [before, actorBefore, holdersBefore, quoteState, balancesBefore] = await Promise.all([
		readCurve(ctx, termId),
		readAccount(ctx, termId, actor.address),
		readHolders(ctx, termId, holders),
		readDepositQuoteState(ctx, termId, options.triple),
		readBalances(ctx, termId, epoch, !options.triple),
	]);
	const composed = composeDepositQuote(ctx, quoteState, assets);
	const [onchainQuoteFee, previewTuple] = await Promise.all([
		dynamicFeeFlatPriceCurveQuoteDepositFee(ctx.curve, { args: [termId, composed.feeBase] }),
		multiVaultPreviewDeposit(ctx.multiVault, { args: [termId, ctx.curveId, assets] }),
	]);
	const preview = { shares: previewTuple[0], assetsAfterFees: previewTuple[1] };

	const replica = dynamicFeeDistributeDeposit({
		startAssets: before.vaultStake,
		netStake: preview.shares,
		feeAmount: onchainQuoteFee,
		config: ctx.config,
		occupancy: occupancyOf(before),
		accFeePerShare: accumulatorsOf(before),
		depositor: actorBefore.lots,
	});

	const hash = await multiVaultDeposit(
		{ address: ctx.multiVault.address, walletClient: actor.wallet, publicClient },
		{ args: [actor.address, termId, ctx.curveId, preview.shares], value: assets }
	);
	const receipt = await waitForSuccess(hash);

	const bandEvents = (await eventParseDepositBandRecorded(publicClient, hash))
		.filter((event) => event.address.toLowerCase() === ctx.curveAddress.toLowerCase())
		.map((event) => ({
			tier: event.args.bandTier,
			stake: event.args.bandStake,
			fee: event.args.bandFee,
		}));
	const recordedEvents = (await eventParseDepositRecorded(publicClient, hash)).filter(
		(event) => event.address.toLowerCase() === ctx.curveAddress.toLowerCase()
	);
	if (recordedEvents.length !== 1) {
		throw new Error(`expected one DepositRecorded, saw ${recordedEvents.length}`);
	}
	const recordedArgs = recordedEvents[0]?.args as NonNullable<
		(typeof recordedEvents)[number]
	>['args'];
	const depositedEvents = parseEventLogs({
		abi: MultiVaultAbi,
		logs: receipt.logs,
		eventName: 'Deposited',
	});
	const depositedArgs = depositedEvents[0]?.args;
	if (!depositedArgs) {
		throw new Error('expected a Deposited event');
	}

	const [after, actorAfter, holdersAfter, balancesAfter] = await Promise.all([
		readCurve(ctx, termId),
		readAccount(ctx, termId, actor.address),
		readHolders(ctx, termId, holders),
		readBalances(ctx, termId, epoch, !options.triple),
	]);

	return {
		termId,
		actor,
		assets,
		epoch,
		before,
		after,
		actorBefore,
		actorAfter,
		holdersBefore,
		holdersAfter,
		composed,
		onchainQuoteFee,
		preview,
		replica,
		receipt,
		bandEvents,
		recorded: {
			shares: recordedArgs.shares,
			fee: recordedArgs.fee,
			sourceTier: recordedArgs.sourceTier,
			topTier: recordedArgs.topTier,
		},
		deposited: {
			assets: depositedArgs.assets,
			assetsAfterFees: depositedArgs.assetsAfterFees,
			shares: depositedArgs.shares,
		},
		balancesBefore,
		balancesAfter,
	};
}

async function readHolders(
	ctx: DynamicFeeContext,
	termId: Hex,
	holders: Address[]
): Promise<Map<Address, AccountSnapshot>> {
	const snapshots = await Promise.all(holders.map((holder) => readAccount(ctx, termId, holder)));
	return new Map(holders.map((holder, index) => [holder, snapshots[index] as AccountSnapshot]));
}

/* ================================ redeem ================================ */

export type RedeemRun = {
	termId: Hex;
	actor: Actor;
	shares: bigint;
	epoch: bigint;
	before: CurveSnapshot;
	after: CurveSnapshot;
	actorBefore: AccountSnapshot;
	actorAfter: AccountSnapshot;
	holdersBefore: Map<Address, AccountSnapshot>;
	holdersAfter: Map<Address, AccountSnapshot>;
	vaultTierBefore: bigint;
	/** `@0xintuition/curves` per-lot quote and its total. */
	quoteLots: DynamicFeeRedeemLotCharge[];
	offchainFee: bigint;
	/** On-chain `quoteRedeemFee(termId, account, shares)` and `previewRedeemFor`. */
	onchainFee: bigint;
	previewFor: { assetsAfterCurveFee: bigint; fee: bigint };
	/** Account-less pricing, on chain (`address(0)`) and off chain (vault tier). */
	accountlessOnchainFee: bigint;
	accountlessOffchainFee: bigint;
	/** MultiVault's holder-agnostic `previewRedeem`. */
	multiVaultPreview: { assetsAfterFees: bigint; sharesUsed: bigint };
	assetsBeforeFees: bigint;
	protocolFee: bigint;
	exitFee: bigint;
	/** Composed holder-accurate payout, also used as the exact `minAssets` floor. */
	expectedAssetsOut: bigint;
	replica: DynamicFeeRedeemDistribution;
	receipt: TransactionReceipt;
	lotEvents: Array<{ tier: bigint; shares: bigint; fee: bigint }>;
	recorded: { shares: bigint; fee: bigint; topTier: bigint };
	redeemed: { assetsAfterFees: bigint; totalFees: bigint; shares: bigint };
	/** The redeemer's native balance change net of gas. */
	received: bigint;
	balancesBefore: Balances;
	balancesAfter: Balances;
};

export async function runRedeem(
	ctx: DynamicFeeContext,
	actor: Actor,
	termId: Hex,
	shares: bigint,
	holders: Address[] = []
): Promise<RedeemRun> {
	const epoch = await multiVaultCurrentEpoch(ctx.multiVault);
	const [before, actorBefore, holdersBefore, balancesBefore, defaultVault] = await Promise.all([
		readCurve(ctx, termId),
		readAccount(ctx, termId, actor.address),
		readHolders(ctx, termId, holders),
		readBalances(ctx, termId, epoch),
		readVault(ctx, termId, DEFAULT_CURVE_ID),
	]);
	const vaultTierBefore = dynamicFeeTierOf(before.vaultStake, ctx.config);
	const quoteLots = dynamicFeeQuoteRedeemFeeLots(
		shares,
		actorBefore.lots,
		vaultTierBefore,
		ctx.config
	);
	const offchainFee = quoteLots.reduce((sum, charge) => sum + charge.fee, 0n);

	const [onchainFee, previewForTuple, accountlessOnchainFee, assetsBeforeFees, mvPreview] =
		await Promise.all([
			dynamicFeeFlatPriceCurveQuoteRedeemFee(ctx.curve, { args: [termId, actor.address, shares] }),
			dynamicFeeFlatPriceCurvePreviewRedeemFor(ctx.curve, {
				args: [termId, actor.address, shares],
			}),
			dynamicFeeFlatPriceCurveQuoteRedeemFee(ctx.curve, { args: [termId, zeroAddress, shares] }),
			multiVaultConvertToAssets(ctx.multiVault, { args: [termId, ctx.curveId, shares] }),
			multiVaultPreviewRedeem(ctx.multiVault, { args: [termId, ctx.curveId, shares] }),
		]);
	const accountlessOffchainFee = dynamicFeeQuoteRedeemFee(shares, vaultTierBefore, ctx.config);
	const protocolFee = feeOnRaw(assetsBeforeFees, ctx.protocolFee, ctx.feeDenominator);
	// A non-default curve's redeem never draws on the default vault, so the gate is its current size.
	const exitFee =
		defaultVault.totalShares >= ctx.feeThreshold
			? feeOnRaw(assetsBeforeFees, ctx.exitFee, ctx.feeDenominator)
			: 0n;
	const expectedAssetsOut = assetsBeforeFees - protocolFee - exitFee - onchainFee;

	const replica = dynamicFeeDistributeRedeem({
		startAssets: before.vaultStake,
		shares,
		feeAmount: onchainFee,
		config: ctx.config,
		occupancy: occupancyOf(before),
		accFeePerShare: accumulatorsOf(before),
		exiter: actorBefore.lots,
	});

	const balanceBefore = await publicClient.getBalance({ address: actor.address });
	const hash = await multiVaultRedeem(
		{ address: ctx.multiVault.address, walletClient: actor.wallet, publicClient },
		{ args: [actor.address, termId, ctx.curveId, shares, expectedAssetsOut] }
	);
	const receipt = await waitForSuccess(hash);
	const balanceAfter = await publicClient.getBalance({ address: actor.address });

	const curveLogs = receipt.logs.filter(
		(log) => log.address.toLowerCase() === ctx.curveAddress.toLowerCase()
	);
	const lotEvents = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs: curveLogs,
		eventName: 'RedeemLotRecorded',
	}).map((event) => ({
		tier: event.args.lotTier,
		shares: event.args.lotShares,
		fee: event.args.lotFee,
	}));
	const recordedArgs = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs: curveLogs,
		eventName: 'RedeemRecorded',
	})[0]?.args;
	const redeemedArgs = parseEventLogs({
		abi: MultiVaultAbi,
		logs: receipt.logs,
		eventName: 'Redeemed',
	})[0]?.args;
	if (!(recordedArgs && redeemedArgs)) {
		throw new Error('expected RedeemRecorded and Redeemed events');
	}

	const [after, actorAfter, holdersAfter, balancesAfter] = await Promise.all([
		readCurve(ctx, termId),
		readAccount(ctx, termId, actor.address),
		readHolders(ctx, termId, holders),
		readBalances(ctx, termId, epoch),
	]);

	return {
		termId,
		actor,
		shares,
		epoch,
		before,
		after,
		actorBefore,
		actorAfter,
		holdersBefore,
		holdersAfter,
		vaultTierBefore,
		quoteLots,
		offchainFee,
		onchainFee,
		previewFor: { assetsAfterCurveFee: previewForTuple[0], fee: previewForTuple[1] },
		accountlessOnchainFee,
		accountlessOffchainFee,
		multiVaultPreview: { assetsAfterFees: mvPreview[0], sharesUsed: mvPreview[1] },
		assetsBeforeFees,
		protocolFee,
		exitFee,
		expectedAssetsOut,
		replica,
		receipt,
		lotEvents,
		recorded: {
			shares: recordedArgs.shares,
			fee: recordedArgs.fee,
			topTier: recordedArgs.topTier,
		},
		redeemed: {
			assetsAfterFees: redeemedArgs.assetsAfterFees,
			totalFees: redeemedArgs.totalFees,
			shares: redeemedArgs.shares,
		},
		received: balanceAfter - balanceBefore + gasCost(receipt),
		balancesBefore,
		balancesAfter,
	};
}

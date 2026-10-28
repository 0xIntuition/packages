import type {
	DynamicFeeAccumulators,
	DynamicFeeConfig,
	DynamicFeeDepositBand,
	DynamicFeeDepositDistribution,
	DynamicFeeLots,
	DynamicFeeTierLadderEntry,
	DynamicFeeTierOccupancy,
	DynamicFeeTierOverride,
} from '@0xintuition/curves';
import {
	DYNAMIC_FEE_ACC_PRECISION,
	DYNAMIC_FEE_NO_LOT,
	dynamicFeeDistributeDeposit,
	dynamicFeeProjectHolderEarning,
	dynamicFeeQuoteDepositBands,
	dynamicFeeTierLadder,
	dynamicFeeTierOf,
} from '@0xintuition/curves';
import {
	bondingCurveRegistryCurveAddresses,
	dynamicFeeFlatPriceCurveAccFeePerShare,
	dynamicFeeFlatPriceCurveBankedEarnings,
	dynamicFeeFlatPriceCurveClaimableAcross,
	dynamicFeeFlatPriceCurveClaimEncode,
	dynamicFeeFlatPriceCurveGetConfig,
	dynamicFeeFlatPriceCurveLotRewardDebt,
	dynamicFeeFlatPriceCurvePendingFor,
	dynamicFeeFlatPriceCurveQuoteDepositFee,
	dynamicFeeFlatPriceCurveTierFeeOverride,
	dynamicFeeFlatPriceCurveTierStake,
	dynamicFeeFlatPriceCurveUserLots,
	dynamicFeeFlatPriceCurveVaultStake,
	multiVaultDepositEncode,
	multiVaultRedeemEncode,
	type ReadConfig,
} from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';

import {
	type MultiVaultDepositQuotePlan,
	type MultiVaultRedeemQuotePlan,
	multivaultQuoteDepositPlan,
	multivaultQuoteRedeemPlan,
} from './multivault';

export type DynamicFeeCurveDepositQuotePlan = {
	curveId: bigint;
	curveAddress: Address;
	termId: Hex;
	assetsIn: bigint;
	curveFee: bigint;
	tierLadder: DynamicFeeTierLadderEntry[];
	/** Where the vault sits before the deposit, and where this deposit leaves it. */
	startTier: bigint;
	landingTier: bigint;
	vaultStakeBefore: bigint;
	/**
	 * The tier bands the FEE quote traverses, and what each one costs — the walk behind `curveFee`,
	 * available before the trade.
	 *
	 * This is the fee walk, not the landing walk: it advances by the fee base net of the CURVE fee
	 * only, mirroring the on-chain `quoteDepositFee`, while the shares that actually land are also
	 * net of MultiVault's protocol, entry and term fees. The landing (what `DepositBandRecorded`
	 * emits, and what `landingTier` reports) can therefore stop a band short of the last band here.
	 * Both walks are the contract's own; they answer different questions.
	 */
	bands: DynamicFeeDepositBand[];
	multiVaultQuote: MultiVaultDepositQuotePlan;
};

export type DynamicFeeCurvePrepareDepositTxResult = {
	args: readonly [Address, Hex, bigint, bigint];
	calldata: Hex;
	value?: bigint;
	quote: DynamicFeeCurveDepositQuotePlan;
};

export type DynamicFeeCurveRedeemQuotePlan = {
	curveId: bigint;
	curveAddress: Address;
	termId: Hex;
	account: Address;
	/**
	 * The account's lots, highest tier first — the order the redeem unwinds them, and the order the
	 * withdrawal fee is priced in: each portion at the rate of the band it entered through.
	 */
	lots: Array<{ tier: bigint; stake: bigint }>;
	/**
	 * The lot the redeem draws from first, so the rate on the next share out. `DYNAMIC_FEE_NO_LOT`
	 * when the account holds no lot at all.
	 */
	topTier: bigint;
	/** Where the vault currently sits, which is NOT what a holder's fee keys on. */
	vaultTier: bigint;
	/** True when the account holds no lot, so the vault's tier prices the whole redemption. */
	usesVaultTierFallback: boolean;
	multiVaultQuote: MultiVaultRedeemQuotePlan;
};

export type DynamicFeeCurvePrepareRedeemTxResult = {
	args: readonly [Address, Hex, bigint, bigint, bigint];
	calldata: Hex;
	quote: DynamicFeeCurveRedeemQuotePlan;
};

export type DynamicFeeCurveClaimableAcrossTermsResult = {
	account: Address;
	termIds: Hex[];
	totalClaimable: bigint;
	claimableTermIds: Hex[];
	/** The account-wide settled balance, which `claimable` folds into every per-term answer. */
	bankedEarnings: bigint;
	/** The unsettled part, per term. Additive, unlike `claimable`. */
	pendingByTermId: Array<{ termId: Hex; pending: bigint }>;
};

export type DynamicFeeCurvePrepareClaimTxResult = {
	args: readonly [readonly Hex[]];
	calldata: Hex;
	claimable: DynamicFeeCurveClaimableAcrossTermsResult;
	/** False when there is nothing to settle. The calldata is still well-formed; sending it wastes gas. */
	isClaimable: boolean;
};

type DynamicFeeCurveDeps = {
	curveAddresses: typeof bondingCurveRegistryCurveAddresses;
	getConfig: typeof dynamicFeeFlatPriceCurveGetConfig;
	tierFeeOverride: typeof dynamicFeeFlatPriceCurveTierFeeOverride;
	quoteDepositFee: typeof dynamicFeeFlatPriceCurveQuoteDepositFee;
	claimableAcross: typeof dynamicFeeFlatPriceCurveClaimableAcross;
	pendingFor: typeof dynamicFeeFlatPriceCurvePendingFor;
	bankedEarnings: typeof dynamicFeeFlatPriceCurveBankedEarnings;
	vaultStake: typeof dynamicFeeFlatPriceCurveVaultStake;
	userLots: typeof dynamicFeeFlatPriceCurveUserLots;
	tierStake: typeof dynamicFeeFlatPriceCurveTierStake;
	accFeePerShare: typeof dynamicFeeFlatPriceCurveAccFeePerShare;
	/**
	 * The depositor's stored lot debts, which decide what a deposit topping up an earning lot banks.
	 * Optional so offline callers that inject every read can omit it; without it the projection
	 * checkpoints the depositor's lots at the current accumulators and reports nothing banked.
	 */
	lotRewardDebt?: typeof dynamicFeeFlatPriceCurveLotRewardDebt;
	quoteDepositPlan: typeof multivaultQuoteDepositPlan;
	quoteRedeemPlan: typeof multivaultQuoteRedeemPlan;
};

const defaultDynamicFeeCurveDeps: DynamicFeeCurveDeps = {
	curveAddresses: bondingCurveRegistryCurveAddresses,
	getConfig: dynamicFeeFlatPriceCurveGetConfig,
	tierFeeOverride: dynamicFeeFlatPriceCurveTierFeeOverride,
	quoteDepositFee: dynamicFeeFlatPriceCurveQuoteDepositFee,
	claimableAcross: dynamicFeeFlatPriceCurveClaimableAcross,
	pendingFor: dynamicFeeFlatPriceCurvePendingFor,
	bankedEarnings: dynamicFeeFlatPriceCurveBankedEarnings,
	vaultStake: dynamicFeeFlatPriceCurveVaultStake,
	userLots: dynamicFeeFlatPriceCurveUserLots,
	tierStake: dynamicFeeFlatPriceCurveTierStake,
	accFeePerShare: dynamicFeeFlatPriceCurveAccFeePerShare,
	lotRewardDebt: dynamicFeeFlatPriceCurveLotRewardDebt,
	quoteDepositPlan: multivaultQuoteDepositPlan,
	quoteRedeemPlan: multivaultQuoteRedeemPlan,
};

/**
 * Reads every tier's manual fee override for a curve, in the shape the pure tier maths takes.
 *
 * The live contract consults `tierFeeOverride[tier]` before falling back to the formulaic rate, so
 * any off-chain rendering of the ladder or its rates must do the same or it silently disagrees
 * wherever an override is set. Exported because it is a prerequisite for using `@0xintuition/curves`
 * directly — without it, every consumer rediscovers both the tier range and the fact that the two
 * rate fields are `uint16`, which viem decodes as a JS `number` while `DynamicFeeTierOverride`
 * declares them as `bigint`. An unchecked pass-through type-checks and then throws inside the first
 * `mulDivUp`.
 * @param config Curve address and public client.
 * @param inputs The curve's config, which carries the tier count to walk.
 * @param deps Injectable protocol read primitives.
 * @returns The set overrides, keyed by tier. Tiers without an override are absent.
 */
export async function dynamicFeeCurveGetTierOverrides(
	config: ReadConfig,
	inputs: { config: DynamicFeeConfig },
	deps: Pick<DynamicFeeCurveDeps, 'tierFeeOverride'> = defaultDynamicFeeCurveDeps
): Promise<Map<bigint, DynamicFeeTierOverride>> {
	const tiers = Array.from({ length: Number(inputs.config.tierCount) }, (_, index) =>
		BigInt(index)
	);
	const results = await Promise.all(
		tiers.map((tier) => deps.tierFeeOverride(config, { args: [tier] }))
	);

	const overrides = new Map<bigint, DynamicFeeTierOverride>();
	tiers.forEach((tier, index) => {
		const [isSet, depositFeeBps, redeemFeeBps] = results[index] as unknown as readonly [
			boolean,
			bigint | number,
			bigint | number,
		];
		if (isSet) {
			overrides.set(tier, {
				isSet,
				depositFeeBps: BigInt(depositFeeBps),
				redeemFeeBps: BigInt(redeemFeeBps),
			});
		}
	});
	return overrides;
}

/**
 * Resolves a dynamic-fee curve's tier ladder for the current vault state — the tier
 * math itself is pure (`@0xintuition/curves`), fed by a single on-chain config read.
 * @param configs `bondingCurveRegistry` (to resolve the curve address) and the shared read config the resolved curve is read through.
 * @param inputs The curve ID to resolve and quote.
 * @param deps Injectable protocol read primitives.
 * @returns The curve address, its config, its overrides, and the full tier ladder.
 */
export async function dynamicFeeCurveGetTierLadder(
	configs: { bondingCurveRegistry: ReadConfig; curveReadConfig: Omit<ReadConfig, 'address'> },
	inputs: { curveId: bigint },
	deps: Pick<
		DynamicFeeCurveDeps,
		'curveAddresses' | 'getConfig' | 'tierFeeOverride'
	> = defaultDynamicFeeCurveDeps
): Promise<{
	curveAddress: Address;
	config: DynamicFeeConfig;
	overrides: Map<bigint, DynamicFeeTierOverride>;
	tierLadder: DynamicFeeTierLadderEntry[];
}> {
	const curveAddress = await deps.curveAddresses(configs.bondingCurveRegistry, {
		args: [inputs.curveId],
	});
	const curveConfig: ReadConfig = { address: curveAddress, ...configs.curveReadConfig };
	const config = await deps.getConfig(curveConfig);
	const overrides = await dynamicFeeCurveGetTierOverrides(curveConfig, { config }, deps);

	return { curveAddress, config, overrides, tierLadder: dynamicFeeTierLadder(config, overrides) };
}

/**
 * Quotes a deposit into a dynamic-fee vault: resolves the curve from the registry, reads the
 * on-chain piecewise deposit-fee quote (exact across every band the deposit traverses, not just the
 * pre-deposit tier), and composes it with the standard MultiVault deposit quote.
 *
 * Also reports the traversal itself — which tier the vault starts in, which it lands in, and the
 * per-band split — because a piecewise fee that arrives as a single number cannot be explained to
 * the person paying it.
 * @param configs `multiVault` and `bondingCurveRegistry` read configs.
 * @param inputs The term/curve to deposit into and the gross asset amount.
 * @param deps Injectable protocol read primitives.
 * @returns The combined dynamic-fee-curve and MultiVault deposit quote.
 */
export async function dynamicFeeCurveQuoteDepositPlan(
	configs: { multiVault: ReadConfig; bondingCurveRegistry: ReadConfig },
	inputs: { termId: Hex; curveId: bigint; assetsIn: bigint; slippageBps?: bigint },
	deps: DynamicFeeCurveDeps = defaultDynamicFeeCurveDeps
): Promise<DynamicFeeCurveDepositQuotePlan> {
	const { termId, curveId, assetsIn, slippageBps } = inputs;

	if (assetsIn <= 0n) {
		throw new Error('assetsIn must be greater than 0.');
	}

	const curveAddress = await deps.curveAddresses(configs.bondingCurveRegistry, {
		args: [curveId],
	});
	const curveConfig: ReadConfig = {
		address: curveAddress,
		publicClient: configs.multiVault.publicClient,
	};

	const [config, multiVaultQuote, vaultStakeBefore] = await Promise.all([
		deps.getConfig(curveConfig),
		deps.quoteDepositPlan(configs.multiVault, { termId, curveId, assetsIn, slippageBps }),
		deps.vaultStake(curveConfig, { args: [termId] }),
	]);

	/*
	 * The fee base is whatever MultiVault decided it was — gross assets less any min-share bootstrap
	 * cost. Quoting the curve on the gross would disagree with the contract on exactly the deposit
	 * that opens a vault.
	 */
	const curveFee = await deps.quoteDepositFee(curveConfig, {
		args: [termId, multiVaultQuote.feeBaseAssets],
	});
	const overrides = await dynamicFeeCurveGetTierOverrides(curveConfig, { config }, deps);

	/*
	 * The landing tier is where the vault sits once `recordDeposit` books the minted shares: flat
	 * pricing means one share is one wei of stake, and the hook advances the vault's stake by the
	 * minted amount.
	 */
	return {
		curveId,
		curveAddress,
		termId,
		assetsIn,
		curveFee,
		tierLadder: dynamicFeeTierLadder(config, overrides),
		startTier: dynamicFeeTierOf(vaultStakeBefore, config),
		landingTier: dynamicFeeTierOf(vaultStakeBefore + multiVaultQuote.sharesOut, config),
		vaultStakeBefore,
		bands: dynamicFeeQuoteDepositBands(
			vaultStakeBefore,
			multiVaultQuote.feeBaseAssets,
			config,
			overrides
		),
		multiVaultQuote,
	};
}

/**
 * Prepares a deposit transaction into a dynamic-fee vault — quotes the deposit (see
 * {@link dynamicFeeCurveQuoteDepositPlan}) and returns the MultiVault `deposit`
 * calldata sized against the quote's slippage-floored share amount.
 * @param configs `multiVault` and `bondingCurveRegistry` read configs.
 * @param inputs The receiver, term/curve to deposit into, and the gross asset amount.
 * @param deps Injectable protocol read primitives.
 * @returns The deposit calldata, args, value, and the quote it was built from.
 */
export async function dynamicFeeCurvePrepareDepositTx(
	configs: { multiVault: ReadConfig; bondingCurveRegistry: ReadConfig },
	inputs: {
		receiver: Address;
		termId: Hex;
		curveId: bigint;
		assetsIn: bigint;
		slippageBps?: bigint;
	},
	deps: DynamicFeeCurveDeps = defaultDynamicFeeCurveDeps
): Promise<DynamicFeeCurvePrepareDepositTxResult> {
	const { receiver, termId, curveId, assetsIn, slippageBps } = inputs;

	const quote = await dynamicFeeCurveQuoteDepositPlan(
		configs,
		{ termId, curveId, assetsIn, slippageBps },
		deps
	);

	const minShares = quote.multiVaultQuote.minSharesOut;
	const args = [receiver, termId, curveId, minShares] as const;
	const calldata = multiVaultDepositEncode(receiver, termId, curveId, minShares);

	return { args, calldata, value: assetsIn, quote };
}

/**
 * Quotes a redeem out of a dynamic-fee vault for a specific account.
 *
 * The withdrawal rate on this curve keys on the tiers the ACCOUNT entered at, not on where the vault
 * sits now, and the two diverge in both directions as the vault moves. A position is a set of lots,
 * one per band the holder entered through, and a redeem unwinds them highest tier first, so a single
 * redemption can be priced at several rates at once. This adds that context to the generic
 * account-aware MultiVault quote: the lots in unwind order, the one the next share out comes from,
 * where the vault currently is, and whether the account holds any lot at all — an account with none
 * falls back to the vault's tier, which is the one case where the two coincide by construction.
 * @param configs `multiVault` and `bondingCurveRegistry` read configs.
 * @param inputs The term/curve, the redeeming account, the share count and optional slippage.
 * @param deps Injectable protocol read primitives.
 * @returns The account's payout, its fee breakdown, and the tiers behind the withdrawal rate.
 */
export async function dynamicFeeCurveQuoteRedeemPlan(
	configs: { multiVault: ReadConfig; bondingCurveRegistry: ReadConfig },
	inputs: {
		termId: Hex;
		curveId: bigint;
		account: Address;
		sharesIn: bigint;
		slippageBps?: bigint;
	},
	deps: DynamicFeeCurveDeps = defaultDynamicFeeCurveDeps
): Promise<DynamicFeeCurveRedeemQuotePlan> {
	const { termId, curveId, account, sharesIn, slippageBps } = inputs;

	const curveAddress = await deps.curveAddresses(configs.bondingCurveRegistry, {
		args: [curveId],
	});
	const curveConfig: ReadConfig = {
		address: curveAddress,
		publicClient: configs.multiVault.publicClient,
	};

	const [config, multiVaultQuote, vaultStake, userLots] = await Promise.all([
		deps.getConfig(curveConfig),
		deps.quoteRedeemPlan(configs.multiVault, { termId, curveId, account, sharesIn, slippageBps }),
		deps.vaultStake(curveConfig, { args: [termId] }),
		deps.userLots(curveConfig, { args: [termId, account] }),
	]);

	const vaultTier = dynamicFeeTierOf(vaultStake, config);
	const lots = toLotList(userLots);
	const usesVaultTierFallback = lots.length === 0;

	return {
		curveId,
		curveAddress,
		termId,
		account,
		lots,
		topTier: lots[0]?.tier ?? DYNAMIC_FEE_NO_LOT,
		vaultTier,
		usesVaultTierFallback,
		multiVaultQuote,
	};
}

/** `userLots` comes back as parallel arrays, highest tier first; this is the same data as a list. */
function toLotList(
	userLots: readonly [readonly bigint[], readonly bigint[]]
): Array<{ tier: bigint; stake: bigint }> {
	const [tiers, stakes] = userLots;
	return tiers.map((tier, index) => ({ tier, stake: stakes[index] ?? 0n }));
}

/** The same lots in the shape `@0xintuition/curves` replays, checkpointed at the supplied debts. */
function toLotMap(
	lots: Array<{ tier: bigint; stake: bigint }>,
	rewardDebts?: readonly bigint[]
): DynamicFeeLots {
	return new Map(
		lots.map((lot, index) => [
			lot.tier,
			{ stake: lot.stake, rewardDebt: rewardDebts?.[index] ?? 0n },
		])
	);
}

/**
 * Prepares a redeem transaction out of a dynamic-fee vault, floored against the redeeming account's
 * own payout rather than a holder-agnostic one.
 * @param configs `multiVault` and `bondingCurveRegistry` read configs.
 * @param inputs The receiver, term/curve, redeeming account, share count and optional slippage.
 * @param deps Injectable protocol read primitives.
 * @returns The redeem calldata, args, and the quote it was built from.
 */
export async function dynamicFeeCurvePrepareRedeemTx(
	configs: { multiVault: ReadConfig; bondingCurveRegistry: ReadConfig },
	inputs: {
		receiver: Address;
		termId: Hex;
		curveId: bigint;
		account: Address;
		sharesIn: bigint;
		slippageBps?: bigint;
	},
	deps: DynamicFeeCurveDeps = defaultDynamicFeeCurveDeps
): Promise<DynamicFeeCurvePrepareRedeemTxResult> {
	const { receiver, termId, curveId, account, sharesIn, slippageBps } = inputs;

	const quote = await dynamicFeeCurveQuoteRedeemPlan(
		configs,
		{ termId, curveId, account, sharesIn, slippageBps },
		deps
	);

	const minAssets = quote.multiVaultQuote.minAssetsOut;
	const args = [receiver, termId, curveId, sharesIn, minAssets] as const;
	const calldata = multiVaultRedeemEncode(receiver, termId, curveId, sharesIn, minAssets);

	return { args, calldata, quote };
}

export type DynamicFeeCurveEarningsProjection = {
	termId: Hex;
	curveId: bigint;
	curveAddress: Address;
	assetsIn: bigint;
	/** The curve fee this deposit pays, which is exactly what the distribution below hands out. */
	curveFee: bigint;
	/** Where the fee goes: per-tier cohort payouts and the exact accumulator deltas. */
	distribution: DynamicFeeDepositDistribution;
	/** Per-tier occupancy the distribution ran against, for rendering "who earns" honestly. */
	occupancy: DynamicFeeTierOccupancy;
	/** Per-tier accumulators the distribution ran against, the "before" the projection measures from. */
	accFeePerShare: DynamicFeeAccumulators;
	/** Present when a holder was named: their lots, total stake, and wei-exact projected earning. */
	holder?: {
		account: Address;
		lots: Array<{ tier: bigint; stake: bigint }>;
		stake: bigint;
		/** The pending delta the contract will write for this holder if the deposit executes now. */
		projectedEarning: bigint;
	};
};

/**
 * Projects what a deposit's curve fee EARNS — for every tier, and optionally for one holder.
 *
 * This is the other half of a deposit quote. The fee side has always been answerable; the earning
 * side is what makes an early position worth taking, and it needs the fulcrum kernel: each
 * traversed band's slice of the fee is spread over the tiers below it by a sliding triangular
 * window, gated on `minEligibleTierStakeBps`, with the depositor's own landing changing the
 * denominators between bands. The kernel maths is `dynamicFeeDistributeDeposit` in
 * `@0xintuition/curves`, a floor-exact mirror of the contract's `recordDeposit`; this function
 * feeds it the on-chain state it needs (config, overrides, per-tier occupancy and accumulators, the
 * depositor's lots) and, for a named holder, sums their lots so the projection is wei-exact rather
 * than approximately pro-rata. A holder with lots at several tiers earns at each of them.
 *
 * A projection is a statement about the CURRENT state: another deposit landing first changes the
 * denominators, exactly as it would change a price quote.
 * @param configs `multiVault` and `bondingCurveRegistry` read configs.
 * @param inputs The term/curve and gross deposit, the depositor (when they hold a position), and optionally a holder to project for.
 * @param deps Injectable protocol read primitives.
 * @returns The per-tier distribution of the deposit's curve fee, and the named holder's exact earning.
 */
export async function dynamicFeeCurveProjectDepositEarnings(
	configs: { multiVault: ReadConfig; bondingCurveRegistry: ReadConfig },
	inputs: {
		termId: Hex;
		curveId: bigint;
		assetsIn: bigint;
		/** The depositing account, so its tracked position can shape the replay. Omit if fresh. */
		depositor?: Address;
		/** A holder to project the earning for. */
		holder?: Address;
	},
	deps: DynamicFeeCurveDeps = defaultDynamicFeeCurveDeps
): Promise<DynamicFeeCurveEarningsProjection> {
	const { termId, curveId, assetsIn, depositor, holder } = inputs;

	const plan = await dynamicFeeCurveQuoteDepositPlan(configs, { termId, curveId, assetsIn }, deps);
	const curveConfig: ReadConfig = {
		address: plan.curveAddress,
		publicClient: configs.multiVault.publicClient,
	};
	const config = await deps.getConfig(curveConfig);
	const overrides = await dynamicFeeCurveGetTierOverrides(curveConfig, { config }, deps);

	const tiers = Array.from({ length: Number(config.tierCount) }, (_, index) => BigInt(index));
	const [stakes, accumulators, depositorLots] = await Promise.all([
		Promise.all(tiers.map((tier) => deps.tierStake(curveConfig, { args: [termId, tier] }))),
		Promise.all(tiers.map((tier) => deps.accFeePerShare(curveConfig, { args: [termId, tier] }))),
		depositor
			? deps.userLots(curveConfig, { args: [termId, depositor] })
			: Promise.resolve(undefined),
	]);

	const occupancy: DynamicFeeTierOccupancy = new Map();
	const accFeePerShare: DynamicFeeAccumulators = new Map();
	tiers.forEach((tier, index) => {
		const stake = stakes[index] ?? 0n;
		if (stake > 0n) {
			occupancy.set(tier, stake);
		}
		const acc = accumulators[index] ?? 0n;
		if (acc > 0n) {
			accFeePerShare.set(tier, acc);
		}
	});

	// A lot's reward debt decides what a deposit topping that lot up banks: `_applyDepositBand`
	// settles the lot at each band it lands in before re-basing it, so a lot carrying pending earnings
	// banks them. The stored debts make `distribution.banked` the amount the chain will bank. Without
	// the read, the lots are checkpointed at their tiers' current accumulators (`stake *
	// accFeePerShare / ACC_PRECISION`, as a settle would write them), which reports nothing banked.
	const depositorPosition = depositorLots ? toLotList(depositorLots) : [];
	const readDebt = deps.lotRewardDebt;
	const depositorDebts =
		depositor && readDebt
			? await Promise.all(
					depositorPosition.map((lot) =>
						readDebt(curveConfig, { args: [termId, depositor, lot.tier] })
					)
				)
			: depositorPosition.map(
					(lot) => (lot.stake * (accFeePerShare.get(lot.tier) ?? 0n)) / DYNAMIC_FEE_ACC_PRECISION
				);
	const distribution = dynamicFeeDistributeDeposit({
		startAssets: plan.vaultStakeBefore,
		netStake: plan.multiVaultQuote.sharesOut,
		feeAmount: plan.curveFee,
		config,
		occupancy,
		overrides,
		accFeePerShare,
		depositor:
			depositorPosition.length > 0 ? toLotMap(depositorPosition, depositorDebts) : undefined,
	});

	const projection: DynamicFeeCurveEarningsProjection = {
		termId,
		curveId,
		curveAddress: plan.curveAddress,
		assetsIn,
		curveFee: plan.curveFee,
		distribution,
		occupancy,
		accFeePerShare,
	};

	if (holder) {
		const holderLots = toLotList(await deps.userLots(curveConfig, { args: [termId, holder] }));
		projection.holder = {
			account: holder,
			lots: holderLots,
			stake: holderLots.reduce((sum, lot) => sum + lot.stake, 0n),
			projectedEarning: dynamicFeeProjectHolderEarning({
				distribution,
				lots: toLotMap(holderLots),
				accBefore: accFeePerShare,
			}),
		};
	}

	return projection;
}

/** Preserves order while dropping repeats — `claim` reverts on a duplicated term. */
function dedupeTermIds(termIds: Hex[]): Hex[] {
	return [...new Set(termIds.map((termId) => termId.toLowerCase() as Hex))].map(
		(lowered) => termIds.find((termId) => termId.toLowerCase() === lowered) as Hex
	);
}

/**
 * Reads what an account can claim across a set of terms, and where it comes from.
 *
 * `claimable(account, termId)` is the obvious read and the wrong one for a multi-term total: it
 * folds in the account's banked (term-independent) balance on every call, so summing or filtering by
 * it per term double-counts that component, and the error grows with the number of positions held.
 * `claimableAcross` is the total `claim` would actually pay; `pendingFor` is the additive per-term
 * part; `bankedEarnings` is the settled remainder. Returning all three is what lets a consumer show
 * the breakdown without reconstructing it wrongly.
 * @param config Read config for the dynamic-fee curve.
 * @param inputs The account and the candidate term IDs to check.
 * @param deps Injectable protocol read primitives.
 * @returns The total claimable across the supplied terms, which of them are non-zero, and the split.
 */
export async function dynamicFeeCurveGetClaimableAcrossTerms(
	config: ReadConfig,
	inputs: { account: Address; termIds: Hex[] },
	deps: Pick<
		DynamicFeeCurveDeps,
		'claimableAcross' | 'pendingFor' | 'bankedEarnings'
	> = defaultDynamicFeeCurveDeps
): Promise<DynamicFeeCurveClaimableAcrossTermsResult> {
	const { account } = inputs;
	// `claimableAcross` reverts on a repeated term rather than assuming uniqueness.
	const termIds = dedupeTermIds(inputs.termIds);

	const [totalClaimable, bankedEarnings, pendingPerTerm] = await Promise.all([
		deps.claimableAcross(config, { args: [account, termIds] }),
		deps.bankedEarnings(config, { args: [account] }),
		Promise.all(termIds.map((termId) => deps.pendingFor(config, { args: [account, termId] }))),
	]);

	return {
		account,
		termIds,
		totalClaimable,
		claimableTermIds: termIds.filter((_, index) => (pendingPerTerm[index] ?? 0n) !== 0n),
		bankedEarnings,
		pendingByTermId: termIds.map((termId, index) => ({
			termId,
			pending: pendingPerTerm[index] ?? 0n,
		})),
	};
}

/**
 * Builds a batched claim transaction for a dynamic-fee curve: discovers which terms hold a claimable
 * balance for the account, then returns one `claim` calldata settling all of them at once.
 *
 * Having nothing to claim is an ordinary state, not an error, so it comes back as `isClaimable:
 * false` rather than as a thrown exception a UI has to catch to render a zero. Term IDs are
 * de-duplicated because the contract reverts with `DynamicFeeFlatPriceCurve_DuplicateTermIds` on a
 * repeat.
 * @param config Read config for the dynamic-fee curve.
 * @param inputs The account and the candidate term IDs to settle.
 * @param deps Injectable protocol read primitives.
 * @returns The claim calldata, args, the claimable breakdown, and whether it is worth sending.
 */
export async function dynamicFeeCurvePrepareClaimTx(
	config: ReadConfig,
	inputs: { account: Address; termIds: Hex[] },
	deps: Pick<
		DynamicFeeCurveDeps,
		'claimableAcross' | 'pendingFor' | 'bankedEarnings'
	> = defaultDynamicFeeCurveDeps
): Promise<DynamicFeeCurvePrepareClaimTxResult> {
	const claimable = await dynamicFeeCurveGetClaimableAcrossTerms(config, inputs, deps);

	return {
		args: [claimable.termIds] as const,
		calldata: dynamicFeeFlatPriceCurveClaimEncode(claimable.termIds),
		claimable,
		isClaimable: claimable.totalClaimable > 0n,
	};
}

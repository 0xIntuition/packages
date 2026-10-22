import type { Address, Hex } from 'viem';
import {
	dynamicFeeCurvePrepareClaimTx,
	dynamicFeeCurvePrepareDepositTx,
	multivaultQuoteDepositPlan,
} from '../index';

import {
	buildPlanEnvelope,
	buildPlanStep,
	requireContext,
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

function toPreviewDepositTuple(value: MultiVaultPreviewDepositResult): readonly [bigint, bigint] {
	if ('sharesOut' in value) {
		return [value.sharesOut, value.assetsAfterFees] as const;
	}

	return [value[0], value[1]] as const;
}

/**
 * Local mirror of `@0xintuition/curves`' `DynamicFeeConfig`, field-for-field. Kept as a
 * separate type here (rather than importing it) so this package's public `.d.ts` doesn't
 * leak a type from a devDependency — the same convention `MultiVaultPreviewDepositResult`
 * and friends already follow in `plans/multivault.ts`.
 */
export type DynamicFeeCurvePlanConfig = {
	width0: bigint;
	tierCount: bigint;
	tierWidthGrowthBps: bigint;
	depositBaseBps: bigint;
	depositGrowthBps: bigint;
	depositCapBps: bigint;
	depositFulcrumAlphaBps: bigint;
	depositKernelSpread: bigint;
	redeemFulcrumAlphaBps: bigint;
	redeemKernelSpread: bigint;
	redeemBaseBps: bigint;
	redeemGrowthBps: bigint;
	redeemCapBps: bigint;
	redeemToFulcrumTiersBps: bigint;
	depositToPriorTierBps: bigint;
	minEligibleTierStakeBps: bigint;
};

/**
 * A single tier's manual fee override read, `[isSet, depositFeeBps, redeemFeeBps]`.
 * The fee fields are `uint16` on-chain, so viem decodes them as `number`, not `bigint`.
 */
export type DynamicFeeCurveTierOverrideRead = readonly [boolean, number, number];

export type DynamicFeeCurveDepositPlanReadContext = {
	curveAddress?: Address;
	config?: DynamicFeeCurvePlanConfig;
	/** Per-tier manual fee override reads, indexed by tier (0-based, matching `config.tierCount`). */
	tierFeeOverrides?: readonly DynamicFeeCurveTierOverrideRead[];
	quoteDepositFee?: bigint;
	previewDeposit?: MultiVaultPreviewDepositResult;
	entryFeeAmount?: bigint;
	protocolFeeAmount?: bigint;
	currentSharePrice?: bigint;
	/** `MultiVault.getVault(termId, curveId).totalShares` — zero means this deposit bootstraps the vault. */
	vaultTotalShares?: bigint;
	/** Only consulted on an empty vault, to double the min-share bootstrap cost for a triple. */
	isTriple?: boolean;
	/** `MultiVault.getGeneralConfig().minShare` — only consulted on an empty vault. */
	minShare?: bigint;
	/** `BondingCurveRegistry.previewMint(minShare, 0, 0, curveId)` — only consulted on an empty vault. */
	previewMint?: bigint;
	/** `totalShares` of the DEFAULT curve's vault, which is what the entry-fee threshold is measured on. */
	defaultVaultTotalShares?: bigint;
	/** `MultiVault.getGeneralConfig().feeThreshold`. Below it the entry fee is waived entirely. */
	feeThreshold?: bigint;
	/** `DynamicFeeFlatPriceCurve.vaultStake(termId)` — what the tier traversal is keyed on. */
	vaultStake?: bigint;
	/** `MultiVault.getGeneralConfig().feeDenominator`, which every MultiVault fee rate is expressed against. */
	feeDenominator?: bigint;
	/** `MultiVault.getAtomConfig().atomWalletDepositFee`, charged on every atom deposit. */
	atomWalletDepositFee?: bigint;
	/** `MultiVault.atomDepositFractionAmount(feeBase)`, charged on a triple deposit. */
	atomDepositFractionAmount?: bigint;
	/** The three atoms under a triple, whose fee thresholds gate the fraction above. */
	tripleAtomIds?: readonly [Hex, Hex, Hex];
};

export type DynamicFeeCurveClaimPlanReadContext = {
	claimableAcross?: bigint;
	/** Per-term pending reads, in the same order as `termIds`. */
	pendingFor?: readonly bigint[];
	/** `DynamicFeeFlatPriceCurve.bankedEarnings(account)` — the settled half of the balance. */
	bankedEarnings?: bigint;
};

export type BuildDynamicFeeCurveDepositPlanInputs = {
	chainId?: IntuitionCoreChainId;
	multiVaultAddress: Address;
	bondingCurveRegistryAddress: Address;
	receiver: Address;
	termId: Hex;
	curveId: bigint;
	assetsIn: bigint;
	slippageBps?: bigint;
	readContext?: DynamicFeeCurveDepositPlanReadContext;
};

export type BuildDynamicFeeCurveClaimPlanInputs = {
	chainId?: IntuitionCoreChainId;
	curveAddress: Address;
	account: Address;
	termIds: Hex[];
	readContext?: DynamicFeeCurveClaimPlanReadContext;
};

/**
 * Builds a deposit plan into a dynamic-fee vault: resolves the curve from the registry,
 * quotes the piecewise deposit fee (exact across every band traversed, not just the
 * pre-deposit tier), and returns the MultiVault `deposit` calldata sized against the
 * slippage-floored share quote.
 * @param inputs Chain, contract addresses, the receiver/term/curve to deposit into, and precomputed read values.
 * @returns An agent-action envelope with the deposit step and the quote it was built from.
 */
export async function dynamicFeeCurveDepositEnvelope(
	inputs: BuildDynamicFeeCurveDepositPlanInputs
) {
	const planName = 'buildDynamicFeeCurveDepositPlan';
	const {
		chainId = 1155,
		multiVaultAddress,
		bondingCurveRegistryAddress,
		receiver,
		termId,
		curveId,
		assetsIn,
		slippageBps,
		readContext,
	} = inputs;

	const deps = {
		curveAddresses: async () =>
			requireContext(readContext?.curveAddress, planName, 'readContext.curveAddress'),
		getConfig: async () => requireContext(readContext?.config, planName, 'readContext.config'),
		tierFeeOverride: async (_config, tierInputs) => {
			const [tier] = tierInputs.args;
			return requireContext(
				readContext?.tierFeeOverrides?.[Number(tier)],
				planName,
				`readContext.tierFeeOverrides[${tier}]`
			);
		},
		quoteDepositFee: async () =>
			requireContext(readContext?.quoteDepositFee, planName, 'readContext.quoteDepositFee'),
		quoteDepositPlan: async (config, quoteInputs) =>
			multivaultQuoteDepositPlan(config, quoteInputs, {
				...toFeeContextDeps({
					vaultTotalShares: readContext?.vaultTotalShares,
					isTriple: readContext?.isTriple,
					minShare: readContext?.minShare,
					minShareCostPerUnit: readContext?.previewMint,
					defaultVaultTotalShares: readContext?.defaultVaultTotalShares,
					feeThreshold: readContext?.feeThreshold,
					feeDenominator: readContext?.feeDenominator,
					atomWalletDepositFee: readContext?.atomWalletDepositFee,
					atomDepositFractionAmount: readContext?.atomDepositFractionAmount,
					tripleAtomIds: readContext?.tripleAtomIds,
				}),
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
			}),
		vaultStake: async () => readContext?.vaultStake ?? 0n,
		userLots: async () => [[], []] as never,
		tierStake: async () => 0n,
		accFeePerShare: async () => 0n,
		bankedEarnings: async () => 0n,
		claimableAcross: async () => 0n,
		pendingFor: async () => 0n,
		quoteRedeemPlan: async () => {
			throw new Error(`${planName} does not build a redeem quote.`);
		},
	} satisfies NonNullable<Parameters<typeof dynamicFeeCurvePrepareDepositTx>[2]>;

	const prepared = await dynamicFeeCurvePrepareDepositTx(
		{
			multiVault: toPureWriteConfig(multiVaultAddress),
			bondingCurveRegistry: toPureReadConfig(bondingCurveRegistryAddress),
		},
		{ receiver, termId, curveId, assetsIn, slippageBps },
		deps
	);

	return buildPlanEnvelope({
		action: 'dynamicFeeCurve.deposit',
		module: 'plans/dynamic-fee-curve',
		method: planName,
		label: 'Dynamic-fee vault deposit',
		description:
			'Deposits into a dynamic-fee-curve MultiVault vault, quoted piecewise across every traversed tier band.',
		tags: ['multivault', 'dynamic-fee-curve', 'deposit'],
		context: {
			multiVaultAddress,
			bondingCurveRegistryAddress,
			receiver,
			termId,
			curveId,
		},
		steps: [
			buildPlanStep({
				id: 'dynamic-fee-curve-deposit',
				intent: {
					chainId,
					contract: 'multivault',
				},
				data: prepared.calldata,
				value: prepared.value,
				label: 'Deposit',
				description: 'Submit the slippage-bounded deposit into the dynamic-fee vault.',
			}),
		],
		estimates: {
			quote: prepared.quote,
		},
	});
}

/**
 * Builds a batched claim plan for a dynamic-fee curve: settles the caller-supplied
 * candidate terms and pays out the total claimable across all of them in one `claim`
 * transaction.
 * @param inputs The curve address, the claiming account, and the candidate term IDs to settle.
 * @returns An agent-action envelope with the claim step and the claimable breakdown it was built from.
 */
export async function dynamicFeeCurveClaimEnvelope(inputs: BuildDynamicFeeCurveClaimPlanInputs) {
	const planName = 'buildDynamicFeeCurveClaimPlan';
	const { chainId = 1155, curveAddress, account, termIds, readContext } = inputs;

	const deps = {
		claimableAcross: async () =>
			requireContext(readContext?.claimableAcross, planName, 'readContext.claimableAcross'),
		pendingFor: async (_config, pendingInputs) => {
			const [, termId] = pendingInputs.args;
			const index = termIds.indexOf(termId);
			return requireContext(
				readContext?.pendingFor?.[index],
				planName,
				`readContext.pendingFor[${index}]`
			);
		},
		bankedEarnings: async () => readContext?.bankedEarnings ?? 0n,
	} satisfies NonNullable<Parameters<typeof dynamicFeeCurvePrepareClaimTx>[2]>;

	const prepared = await dynamicFeeCurvePrepareClaimTx(
		toPureReadConfig(curveAddress),
		{ account, termIds },
		deps
	);

	return buildPlanEnvelope({
		action: 'dynamicFeeCurve.claim',
		module: 'plans/dynamic-fee-curve',
		method: planName,
		label: 'Dynamic-fee curve claim',
		description:
			'Claims accrued dynamic-fee-curve earnings across the supplied terms in one transaction.',
		tags: ['dynamic-fee-curve', 'claim'],
		context: {
			curveAddress,
			account,
			termIds,
		},
		steps: [
			buildPlanStep({
				id: 'dynamic-fee-curve-claim',
				intent: {
					chainId,
					contract: 'dynamic-fee-flat-price-curve',
					address: curveAddress,
				},
				data: prepared.calldata,
				label: 'Claim',
				description: 'Settle the supplied terms and pull the total claimable balance.',
			}),
		],
		estimates: {
			claimable: prepared.claimable,
		},
	});
}

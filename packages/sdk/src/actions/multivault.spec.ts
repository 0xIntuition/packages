import {
	ApprovalTypes,
	multiVaultApproveEncode,
	type ReadConfig,
	type WriteConfig,
} from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import {
	multivaultCreateAndSeedTerm,
	multivaultGetUserPositionSnapshot,
	multivaultGetUtilizationAnalyticsBundle,
	multivaultPrepareDepositTx,
	multivaultPrepareMulticallTx,
	multivaultPrepareOnBehalfOfCreationPlan,
	multivaultPrepareRedeemTx,
	multivaultQuoteDepositPlan,
	multivaultQuoteRedeemPlan,
} from './multivault';

const ACCOUNT = '0x1111111111111111111111111111111111111111' as Address;
const MULTIVAULT = '0x2222222222222222222222222222222222222222' as Address;
const TERM_ID = `0x${'ab'.repeat(32)}` as Hex;

const CURVE = '0x3333333333333333333333333333333333333333' as Address;
const REGISTRY = '0x4444444444444444444444444444444444444444' as Address;

const writeConfig = {} as WriteConfig;
const readConfig = { address: MULTIVAULT } as ReadConfig;

/**
 * The reads behind the fee base and the fee-threshold gates.
 *
 * Defaults describe an established, well-funded vault: the deposit is not the bootstrapping one, and
 * the default vault sits far above `feeThreshold`, so both fees apply and the fee base is the gross
 * amount. Individual tests override only the field whose behaviour they are pinning.
 */
function feeContextStubs(
	overrides: {
		totalShares?: bigint;
		defaultVaultShares?: bigint;
		feeThreshold?: bigint;
		minShare?: bigint;
		minShareCostPerUnit?: bigint;
		isTriple?: boolean;
		atomWalletDepositFee?: bigint;
		atomDepositFraction?: bigint;
	} = {}
) {
	const {
		totalShares = 1_000n,
		defaultVaultShares = 1_000_000n,
		feeThreshold = 1_000n,
		minShare = 100n,
		minShareCostPerUnit = 100n,
		isTriple = false,
		atomWalletDepositFee = 0n,
		atomDepositFraction = 0n,
	} = overrides;

	return {
		getVault: async (_config: ReadConfig, inputs: { args: readonly unknown[] }) =>
			(inputs.args[1] === 1n ? [0n, defaultVaultShares] : [0n, totalShares]) as const,
		getGeneralConfig: async () =>
			[ACCOUNT, ACCOUNT, 10_000n, ACCOUNT, 0n, minShare, 0n, feeThreshold] as const,
		getBondingCurveConfig: async () => [REGISTRY, 1n] as const,
		isTriple: async () => isTriple,
		previewMint: async () => minShareCostPerUnit,
		// `atomWalletDepositFee` of 0 keeps the term-type fee out of the arithmetic unless a test
		// opts into it; the denominator comes from the general config above.
		getAtomConfig: async () => [0n, atomWalletDepositFee] as const,
		getTriple: async () => [TERM_ID, TERM_ID, TERM_ID] as const,
		atomDepositFractionAmount: async () => atomDepositFraction,
	};
}

/** The curve-side reads behind an account-aware withdrawal fee. */
function curveFeeStubs(overrides: { hasHook?: boolean; curveFee?: bigint } = {}) {
	const { hasHook = true, curveFee = 0n } = overrides;
	return {
		curveAddresses: async () => CURVE,
		hasRedeemFeeHook: async () => hasHook,
		quoteRedeemFee: async () => curveFee,
	};
}

describe('multivault SDK actions', () => {
	it('quotes a deposit plan with slippage and fee breakdown', async () => {
		const quote = await multivaultQuoteDepositPlan(
			writeConfig,
			{
				termId: TERM_ID,
				curveId: 1n,
				assetsIn: 1_000n,
				slippageBps: 100n,
			},
			{
				...feeContextStubs(),
				previewDeposit: async () => [500n, 970n] as const,
				entryFeeAmount: async () => 10n,
				protocolFeeAmount: async () => 5n,
				currentSharePrice: async () => 2_000_000_000_000_000_000n,
			} as Parameters<typeof multivaultQuoteDepositPlan>[2]
		);

		expect(quote.sharesOut).toBe(500n);
		expect(quote.minSharesOut).toBe(495n);
		expect(quote.assetsAfterFees).toBe(970n);
		expect(quote.totalEstimatedFees).toBe(30n);
		expect(quote.entryFee).toBe(10n);
		expect(quote.protocolFee).toBe(5n);
		expect(quote.slippageBps).toBe(100n);
		expect(quote.effectivePricePerShare).toBe(2_000_000_000_000_000_000n);
		expect(quote.feeBaseAssets).toBe(1_000n);
		expect(quote.isFirstDeposit).toBe(false);
		expect(quote.entryFeeWaived).toBe(false);
	});

	it('reports the atom-wallet deposit fee, which the other components do not include', async () => {
		const quote = await multivaultQuoteDepositPlan(
			readConfig,
			{ termId: TERM_ID, curveId: 2n, assetsIn: 1_000n },
			{
				// 500 bps of a 10_000 denominator = 5% of the fee base.
				...feeContextStubs({ atomWalletDepositFee: 500n }),
				previewDeposit: async () => [900n, 900n] as const,
				entryFeeAmount: async () => 0n,
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultQuoteDepositPlan>[2]
		);

		expect(quote.termFeeKind).toBe('atom-wallet');
		expect(quote.termFee).toBe(50n);
		expect(quote.termFeeWaived).toBe(false);
	});

	it('waives the triple deposit fraction unless every underlying atom is above the threshold', async () => {
		const quote = await multivaultQuoteDepositPlan(
			readConfig,
			{ termId: TERM_ID, curveId: 2n, assetsIn: 1_000n },
			{
				...feeContextStubs({
					isTriple: true,
					atomDepositFraction: 90n,
					defaultVaultShares: 10n,
					feeThreshold: 1_000n,
				}),
				previewDeposit: async () => [900n, 900n] as const,
				entryFeeAmount: async () => 0n,
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultQuoteDepositPlan>[2]
		);

		expect(quote.termFeeKind).toBe('atom-deposit-fraction');
		expect(quote.termFeeWaived).toBe(true);
		expect(quote.termFee).toBe(0n);
	});

	it('quotes the fee components on the netted base for a bootstrapping deposit', async () => {
		let quotedFeeBase: bigint | undefined;

		const quote = await multivaultQuoteDepositPlan(
			readConfig,
			{ termId: TERM_ID, curveId: 2n, assetsIn: 1_000n },
			{
				...feeContextStubs({ totalShares: 0n, minShareCostPerUnit: 40n }),
				previewDeposit: async () => [900n, 900n] as const,
				entryFeeAmount: async (_config, inputs) => {
					quotedFeeBase = inputs.args[0] as bigint;
					return 0n;
				},
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultQuoteDepositPlan>[2]
		);

		expect(quote.isFirstDeposit).toBe(true);
		expect(quote.minShareCost).toBe(40n);
		expect(quote.feeBaseAssets).toBe(960n);
		expect(quotedFeeBase).toBe(960n);
	});

	it('doubles the bootstrap cost for a triple', async () => {
		const quote = await multivaultQuoteDepositPlan(
			readConfig,
			{ termId: TERM_ID, curveId: 2n, assetsIn: 1_000n },
			{
				...feeContextStubs({ totalShares: 0n, minShareCostPerUnit: 40n, isTriple: true }),
				previewDeposit: async () => [900n, 900n] as const,
				entryFeeAmount: async () => 0n,
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultQuoteDepositPlan>[2]
		);

		expect(quote.minShareCost).toBe(80n);
		expect(quote.feeBaseAssets).toBe(920n);
	});

	it('reports the entry fee as waived while the default vault is below the threshold', async () => {
		const quote = await multivaultQuoteDepositPlan(
			readConfig,
			{ termId: TERM_ID, curveId: 2n, assetsIn: 1_000n },
			{
				...feeContextStubs({ defaultVaultShares: 10n, feeThreshold: 1_000n }),
				previewDeposit: async () => [1_000n, 1_000n] as const,
				entryFeeAmount: async () => 25n,
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultQuoteDepositPlan>[2]
		);

		expect(quote.entryFeeWaived).toBe(true);
		expect(quote.entryFee).toBe(0n);
	});

	it('prepares deposit calldata using slippage-adjusted minimum shares', async () => {
		const prepared = await multivaultPrepareDepositTx(
			writeConfig,
			{
				receiver: ACCOUNT,
				termId: TERM_ID,
				curveId: 42n,
				assetsIn: 1_000n,
				slippageBps: 200n,
				value: 1_000n,
			},
			{
				...feeContextStubs(),
				previewDeposit: async () => [1_000n, 980n] as const,
				entryFeeAmount: async () => 0n,
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultPrepareDepositTx>[2]
		);

		expect(prepared.quote.minSharesOut).toBe(980n);
		expect(prepared.args).toEqual([ACCOUNT, TERM_ID, 42n, 980n]);
		expect(prepared.value).toBe(1_000n);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
	});

	it('defaults the deposit value to assetsIn, since MultiVault deposits exactly msg.value', async () => {
		const deps = {
			...feeContextStubs(),
			previewDeposit: async () => [1_000n, 980n] as const,
			entryFeeAmount: async () => 0n,
			protocolFeeAmount: async () => 0n,
			currentSharePrice: async () => 1n,
		} as Parameters<typeof multivaultPrepareDepositTx>[2];
		const inputs = { receiver: ACCOUNT, termId: TERM_ID, curveId: 42n, assetsIn: 1_000n };

		const prepared = await multivaultPrepareDepositTx(writeConfig, inputs, deps);
		expect(prepared.value).toBe(1_000n);
	});

	it('returns a normalized user position snapshot including utilization metrics', async () => {
		const snapshot = await multivaultGetUserPositionSnapshot(
			readConfig,
			{
				account: ACCOUNT,
				termId: TERM_ID,
				curveId: 7n,
				includeUtilization: true,
			},
			{
				getShares: async () => 250n,
				maxRedeem: async () => 200n,
				convertToAssets: async (_, inputs) => {
					const shares = inputs.args[2] as bigint;
					return shares * 3n;
				},
				currentSharePrice: async () => 3_000_000_000_000_000_000n,
				getVault: async () => [12_000n, 4_000n] as const,
				currentEpoch: async () => 11n,
				getTotalUtilizationForEpoch: async () => 900n,
				getUserUtilizationForEpoch: async () => 90n,
				getUserUtilizationInEpoch: async () => 95n,
			} as Parameters<typeof multivaultGetUserPositionSnapshot>[2]
		);

		expect(snapshot.shares).toBe(250n);
		expect(snapshot.maxRedeemShares).toBe(200n);
		expect(snapshot.estimatedAssetsForCurrentShares).toBe(750n);
		expect(snapshot.estimatedAssetsForMaxRedeem).toBe(600n);
		expect(snapshot.vaultTotalAssets).toBe(12_000n);
		expect(snapshot.vaultTotalShares).toBe(4_000n);
		expect(snapshot.utilization).toEqual({
			epoch: 11n,
			totalForEpoch: 900n,
			userForEpoch: 90n,
			userInEpoch: 95n,
		});
	});

	it('quotes a redeem plan with slippage and fee breakdown', async () => {
		const quote = await multivaultQuoteRedeemPlan(
			readConfig,
			{
				termId: TERM_ID,
				curveId: 3n,
				account: ACCOUNT,
				sharesIn: 500n,
				slippageBps: 100n,
			},
			{
				...feeContextStubs(),
				...curveFeeStubs({ hasHook: false }),
				convertToAssets: async () => 812n,
				exitFeeAmount: async () => 8n,
				protocolFeeAmount: async () => 4n,
				currentSharePrice: async () => 1_500_000_000_000_000_000n,
			} as Parameters<typeof multivaultQuoteRedeemPlan>[2]
		);

		expect(quote.assetsOut).toBe(800n);
		expect(quote.sharesUsed).toBe(500n);
		expect(quote.minAssetsOut).toBe(792n);
		expect(quote.totalEstimatedFees).toBe(12n);
		expect(quote.curveFee).toBe(0n);
		expect(quote.curveAddress).toBeNull();
	});

	it('nets the curve withdrawal fee quoted for the redeeming account', async () => {
		let quotedAccount: Address | undefined;

		const quote = await multivaultQuoteRedeemPlan(
			readConfig,
			{ termId: TERM_ID, curveId: 3n, account: ACCOUNT, sharesIn: 500n, slippageBps: 100n },
			{
				...feeContextStubs(),
				curveAddresses: async () => CURVE,
				hasRedeemFeeHook: async () => true,
				quoteRedeemFee: async (_config, inputs) => {
					quotedAccount = inputs.args[1] as Address;
					return 50n;
				},
				convertToAssets: async () => 812n,
				exitFeeAmount: async () => 8n,
				protocolFeeAmount: async () => 4n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultQuoteRedeemPlan>[2]
		);

		expect(quotedAccount).toBe(ACCOUNT);
		expect(quote.curveFee).toBe(50n);
		expect(quote.curveAddress).toBe(CURVE);
		expect(quote.assetsOut).toBe(750n);
		expect(quote.totalEstimatedFees).toBe(62n);
	});

	it('reports the exit fee as waived when the redemption empties the default vault', async () => {
		const quote = await multivaultQuoteRedeemPlan(
			readConfig,
			{ termId: TERM_ID, curveId: 1n, account: ACCOUNT, sharesIn: 999_999n },
			{
				...feeContextStubs({ defaultVaultShares: 1_000_000n, feeThreshold: 1_000n }),
				...curveFeeStubs({ hasHook: false }),
				convertToAssets: async () => 1_000n,
				exitFeeAmount: async () => 10n,
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultQuoteRedeemPlan>[2]
		);

		expect(quote.exitFeeWaived).toBe(true);
		expect(quote.exitFee).toBe(0n);
		expect(quote.assetsOut).toBe(1_000n);
	});

	it('prepares redeem calldata using slippage-adjusted minimum assets out', async () => {
		const prepared = await multivaultPrepareRedeemTx(
			writeConfig,
			{
				receiver: ACCOUNT,
				termId: TERM_ID,
				curveId: 9n,
				account: ACCOUNT,
				sharesIn: 750n,
				slippageBps: 50n,
			},
			{
				...feeContextStubs(),
				...curveFeeStubs({ hasHook: false }),
				convertToAssets: async () => 1_015n,
				exitFeeAmount: async () => 10n,
				protocolFeeAmount: async () => 5n,
				currentSharePrice: async () => 2_000_000_000_000_000_000n,
			} as Parameters<typeof multivaultPrepareRedeemTx>[2]
		);

		expect(prepared.quote.minAssetsOut).toBe(995n);
		expect(prepared.args).toEqual([ACCOUNT, TERM_ID, 9n, 750n, 995n]);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
	});

	it('builds create-and-seed plan with create and deposit batch steps', async () => {
		const plan = await multivaultCreateAndSeedTerm(
			writeConfig,
			{
				receiver: ACCOUNT,
				atomsToCreate: [{ termId: TERM_ID, data: '0x1234', assetsIn: 100n }],
				seedDeposits: [{ termId: TERM_ID, curveId: 1n, assetsIn: 500n, slippageBps: 100n }],
			},
			{
				...feeContextStubs(),
				previewAtomCreate: async () => [50n, 99n, 98n] as const,
				previewTripleCreate: async () => [0n, 0n, 0n] as const,
				previewDeposit: async () => [250n, 495n] as const,
				entryFeeAmount: async () => 0n,
				protocolFeeAmount: async () => 0n,
				currentSharePrice: async () => 1n,
			} as Parameters<typeof multivaultCreateAndSeedTerm>[2]
		);

		expect(plan.createAtomPreviews[0]?.sharesOut).toBe(50n);
		expect(plan.seedDepositQuotes[0]?.minSharesOut).toBe(247n);
		expect(plan.steps.map((step) => step.type)).toEqual(['create-atoms', 'deposit-batch']);
		expect(plan.totalValue).toBe(600n);
	});

	it('returns utilization analytics bundle for epoch range', async () => {
		const bundle = await multivaultGetUtilizationAnalyticsBundle(
			readConfig,
			{ account: ACCOUNT, startEpoch: 3n, endEpoch: 5n },
			{
				currentEpoch: async () => 8n,
				getTotalUtilizationForEpoch: async (_, inputs) => {
					const epoch = inputs.args[0] as bigint;
					return epoch * 100n;
				},
				getUserUtilizationForEpoch: async (_, inputs) => {
					const epoch = inputs.args[1] as bigint;
					return epoch * 10n;
				},
				getUserUtilizationInEpoch: async (_, inputs) => {
					const epoch = inputs.args[1] as bigint;
					return epoch * 11n;
				},
				getUserLastActiveEpoch: async () => 7n,
			} as Parameters<typeof multivaultGetUtilizationAnalyticsBundle>[2]
		);

		expect(bundle.points).toHaveLength(3);
		expect(bundle.aggregateTotalUtilization).toBe(1_200n);
		expect(bundle.aggregateUserUtilization).toBe(120n);
		expect(bundle.lastActiveEpoch).toBe(7n);
		expect(bundle.points[1]?.deltaFromPreviousTotal).toBe(100n);
		expect(bundle.points[2]?.deltaFromPreviousUser).toBe(10n);
	});

	it('prepends an approval step when the caller lacks CREATION approval', async () => {
		const CALLER = '0x3333333333333333333333333333333333333333' as Address;
		const plan = await multivaultPrepareOnBehalfOfCreationPlan(
			readConfig,
			{
				creator: ACCOUNT,
				caller: CALLER,
				atoms: [{ data: '0x1234', assets: 100n }],
			},
			{
				isApprovedToCreate: async () => false,
				isApprovedToDeposit: async () => false,
				isApprovedToRedeem: async () => false,
			} as Parameters<typeof multivaultPrepareOnBehalfOfCreationPlan>[2]
		);

		expect(plan.approvalAlreadyGranted).toBe(false);
		expect(plan.steps.map((step) => step.type)).toEqual(['approve', 'create-atoms-for']);
		expect(plan.steps[0]?.signer).toBe('creator');
		expect(plan.steps[0]?.calldata).toBe(multiVaultApproveEncode(CALLER, ApprovalTypes.CREATION));
		expect(plan.steps[1]?.signer).toBe('caller');
		expect(plan.steps[1]?.value).toBe(100n);
	});

	it('skips the approval step when CREATION approval already exists', async () => {
		const CALLER = '0x3333333333333333333333333333333333333333' as Address;
		const plan = await multivaultPrepareOnBehalfOfCreationPlan(
			readConfig,
			{
				creator: ACCOUNT,
				caller: CALLER,
				triples: [{ subjectId: TERM_ID, predicateId: TERM_ID, objectId: TERM_ID, assets: 50n }],
			},
			{
				isApprovedToCreate: async () => true,
				isApprovedToDeposit: async () => false,
				isApprovedToRedeem: async () => false,
			} as Parameters<typeof multivaultPrepareOnBehalfOfCreationPlan>[2]
		);

		expect(plan.approvalAlreadyGranted).toBe(true);
		expect(plan.steps.map((step) => step.type)).toEqual(['create-triples-for']);
	});

	it('preserves an existing DEPOSIT/REDEMPTION approval instead of clobbering it with CREATION-only', async () => {
		const CALLER = '0x3333333333333333333333333333333333333333' as Address;
		const plan = await multivaultPrepareOnBehalfOfCreationPlan(
			readConfig,
			{
				creator: ACCOUNT,
				caller: CALLER,
				atoms: [{ data: '0x1234', assets: 100n }],
			},
			{
				isApprovedToCreate: async () => false,
				// The creator previously granted the caller both DEPOSIT and REDEMPTION.
				isApprovedToDeposit: async () => true,
				isApprovedToRedeem: async () => true,
			} as Parameters<typeof multivaultPrepareOnBehalfOfCreationPlan>[2]
		);

		// `approve` replaces the whole bitmask, so the plan must request DEPOSIT|REDEMPTION|CREATION
		// (= ALL) rather than CREATION alone, or it would silently revoke the existing grants.
		expect(plan.steps[0]?.calldata).toBe(multiVaultApproveEncode(CALLER, ApprovalTypes.ALL));
	});

	it('rejects on-behalf-of creation when creator equals caller', async () => {
		await expect(
			multivaultPrepareOnBehalfOfCreationPlan(readConfig, {
				creator: ACCOUNT,
				caller: ACCOUNT,
				atoms: [{ data: '0x1234', assets: 100n }],
			})
		).rejects.toThrow('needs no approval');
	});

	it('assembles a multicall batch with aligned data/value arrays', () => {
		const prepared = multivaultPrepareMulticallTx([
			{ calldata: '0xaaaa', value: 100n },
			{ calldata: '0xbbbb', value: 0n },
		]);

		expect(prepared.args).toEqual([
			['0xaaaa', '0xbbbb'],
			[100n, 0n],
		]);
		expect(prepared.value).toBe(100n);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
	});

	it('rejects an empty multicall batch', () => {
		expect(() => multivaultPrepareMulticallTx([])).toThrow('At least one sub-call is required.');
	});
});

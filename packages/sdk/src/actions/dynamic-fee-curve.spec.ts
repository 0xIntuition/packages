import { DYNAMIC_FEE_NO_LOT } from '@0xintuition/curves';
import type { ReadConfig } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import {
	dynamicFeeCurveGetClaimableAcrossTerms,
	dynamicFeeCurveGetTierLadder,
	dynamicFeeCurvePrepareClaimTx,
	dynamicFeeCurvePrepareDepositTx,
	dynamicFeeCurvePrepareRedeemTx,
	dynamicFeeCurveProjectDepositEarnings,
	dynamicFeeCurveQuoteDepositPlan,
	dynamicFeeCurveQuoteRedeemPlan,
} from './dynamic-fee-curve';

const ACCOUNT = '0x1111111111111111111111111111111111111111' as Address;
const REGISTRY = '0x2222222222222222222222222222222222222222' as Address;
const CURVE = '0x4444444444444444444444444444444444444444' as Address;
const TERM_ID = `0x${'ab'.repeat(32)}` as Hex;
const TERM_ID_2 = `0x${'cd'.repeat(32)}` as Hex;

const bondingCurveRegistry = { address: REGISTRY } as ReadConfig;
const multiVault = { publicClient: {} } as unknown as ReadConfig;
const curveReadConfig = { address: CURVE } as ReadConfig;

type DynamicFeeConfigLike = {
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

const config: DynamicFeeConfigLike = {
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

const stubMultiVaultQuote = async () =>
	({
		termId: TERM_ID,
		curveId: 5n,
		assetsIn: 1_000n,
		feeBaseAssets: 1_000n,
		minShareCost: 0n,
		isFirstDeposit: false,
		sharesOut: 950n,
		minSharesOut: 940n,
		assetsAfterFees: 980n,
		entryFee: 10n,
		entryFeeWaived: false,
		protocolFee: 10n,
		totalEstimatedFees: 20n,
		currentSharePrice: 10n ** 18n,
		effectivePricePerShare: 10n ** 18n,
		slippageBps: 100n,
	}) as never;

/** A first-ever deposit: MultiVault has already netted the bootstrap cost off the gross. */
const stubBootstrapMultiVaultQuote = async () =>
	({
		termId: TERM_ID,
		curveId: 5n,
		assetsIn: 1_000n,
		feeBaseAssets: 960n,
		minShareCost: 40n,
		isFirstDeposit: true,
		sharesOut: 900n,
		minSharesOut: 891n,
		assetsAfterFees: 900n,
		entryFee: 0n,
		entryFeeWaived: true,
		protocolFee: 0n,
		totalEstimatedFees: 100n,
		currentSharePrice: 10n ** 18n,
		effectivePricePerShare: 10n ** 18n,
		slippageBps: 100n,
	}) as never;

const stubMultiVaultRedeemQuote = async () =>
	({
		termId: TERM_ID,
		curveId: 5n,
		account: ACCOUNT,
		sharesIn: 500n,
		sharesUsed: 500n,
		assetsBeforeFees: 1_000n,
		assetsOut: 940n,
		minAssetsOut: 930n,
		exitFee: 10n,
		exitFeeWaived: false,
		protocolFee: 10n,
		curveFee: 40n,
		curveAddress: CURVE,
		totalEstimatedFees: 60n,
		currentSharePrice: 10n ** 18n,
		effectivePricePerShare: 10n ** 18n,
		slippageBps: 100n,
	}) as never;

describe('dynamic-fee-curve SDK actions', () => {
	it('resolves the curve from the registry and builds its tier ladder', async () => {
		const result = await dynamicFeeCurveGetTierLadder(
			{ bondingCurveRegistry, curveReadConfig: {} },
			{ curveId: 5n },
			{
				curveAddresses: async () => CURVE,
				getConfig: async () => config as never,
				tierFeeOverride: async () => [false, 0n, 0n] as never,
			} as Parameters<typeof dynamicFeeCurveGetTierLadder>[2]
		);

		expect(result.curveAddress).toBe(CURVE);
		expect(result.tierLadder).toHaveLength(4);
		expect(result.tierLadder[0]?.depositFeeBps).toBe(100n);
	});

	it('applies a live tierFeeOverride to the tier ladder instead of only the formulaic rate', async () => {
		const result = await dynamicFeeCurveGetTierLadder(
			{ bondingCurveRegistry, curveReadConfig: {} },
			{ curveId: 5n },
			{
				curveAddresses: async () => CURVE,
				getConfig: async () => config as never,
				tierFeeOverride: async (_config, inputs) => {
					const [tier] = inputs.args;
					// Tier 2 carries a manual override (within the deposit/withdrawal caps of
					// 500/400); every other tier is unset. `depositFeeBps`/`redeemFeeBps` are
					// `uint16` on-chain, so viem decodes them as plain JS `number` — using real
					// numbers (not bigint literals) here exercises the BigInt() coercion in
					// `fetchTierOverrides` instead of masking it.
					if (tier === 2n) {
						return [true, 250, 111] as never;
					}
					return [false, 0, 0] as never;
				},
			} as Parameters<typeof dynamicFeeCurveGetTierLadder>[2]
		);

		// Formulaic rate would be depositBaseBps + tier*depositGrowthBps = 100 + 2*50 = 200.
		expect(result.tierLadder[2]?.depositFeeBps).toBe(250n);
		expect(result.tierLadder[2]?.redeemFeeBps).toBe(111n);
		// Unaffected tiers still use the formulaic rate.
		expect(result.tierLadder[1]?.depositFeeBps).toBe(150n);
	});

	const curveDeps = {
		curveAddresses: async () => CURVE,
		getConfig: async () => config as never,
		tierFeeOverride: async () => [false, 0n, 0n] as never,
		vaultStake: async () => 0n,
		userLots: async () => [[], []] as never,
		bankedEarnings: async () => 0n,
	};

	it('quotes a dynamic-fee deposit by composing curve and MultiVault reads', async () => {
		const quote = await dynamicFeeCurveQuoteDepositPlan(
			{ multiVault, bondingCurveRegistry },
			{ termId: TERM_ID, curveId: 5n, assetsIn: 1_000n },
			{
				...curveDeps,
				quoteDepositFee: async () => 42n,
				claimableAcross: async () => 0n,
				quoteDepositPlan: stubMultiVaultQuote,
			} as Parameters<typeof dynamicFeeCurveQuoteDepositPlan>[2]
		);

		expect(quote.curveAddress).toBe(CURVE);
		expect(quote.curveFee).toBe(42n);
		expect(quote.tierLadder).toHaveLength(4);
		expect(quote.multiVaultQuote.minSharesOut).toBe(940n);
	});

	it('reports the tiers the deposit traverses and the per-band split behind the fee', async () => {
		const quote = await dynamicFeeCurveQuoteDepositPlan(
			{ multiVault, bondingCurveRegistry },
			{ termId: TERM_ID, curveId: 5n, assetsIn: 1_000n },
			{
				...curveDeps,
				// A vault sitting just inside tier 0, whose 1_000-asset deposit climbs out of it.
				vaultStake: async () => 900n,
				quoteDepositFee: async () => 42n,
				claimableAcross: async () => 0n,
				quoteDepositPlan: stubMultiVaultQuote,
			} as Parameters<typeof dynamicFeeCurveQuoteDepositPlan>[2]
		);

		expect(quote.vaultStakeBefore).toBe(900n);
		expect(quote.startTier).toBe(0n);
		expect(quote.landingTier).toBeGreaterThan(quote.startTier);
		expect(quote.bands.length).toBeGreaterThan(1);
		expect(quote.bands[0]?.tier).toBe(quote.startTier);
		// Every band is charged at its own tier's rate, and they sum to the deposit's fee base.
		expect(quote.bands.reduce((sum, band) => sum + band.assets, 0n)).toBe(
			quote.multiVaultQuote.feeBaseAssets
		);
	});

	it('quotes the curve on the fee base MultiVault decided, not on the gross assets', async () => {
		let quotedAssets: bigint | undefined;

		const quote = await dynamicFeeCurveQuoteDepositPlan(
			{ multiVault, bondingCurveRegistry },
			{ termId: TERM_ID, curveId: 5n, assetsIn: 1_000n },
			{
				...curveDeps,
				quoteDepositFee: async (_config, inputs) => {
					quotedAssets = inputs.args[1] as bigint;
					return 42n;
				},
				claimableAcross: async () => 0n,
				quoteDepositPlan: stubBootstrapMultiVaultQuote,
			} as Parameters<typeof dynamicFeeCurveQuoteDepositPlan>[2]
		);

		// Gross is 1_000; the bootstrap cost of 40 is netted off before anything is charged.
		expect(quotedAssets).toBe(960n);
		expect(quote.multiVaultQuote.minShareCost).toBe(40n);
		expect(quote.curveFee).toBe(42n);
	});

	it('rejects a zero-asset deposit quote', async () => {
		await expect(
			dynamicFeeCurveQuoteDepositPlan(
				{ multiVault, bondingCurveRegistry },
				{ termId: TERM_ID, curveId: 5n, assetsIn: 0n }
			)
		).rejects.toThrow('assetsIn must be greater than 0.');
	});

	it('prepares deposit calldata sized against the MultiVault slippage floor', async () => {
		const prepared = await dynamicFeeCurvePrepareDepositTx(
			{ multiVault, bondingCurveRegistry },
			{ receiver: ACCOUNT, termId: TERM_ID, curveId: 5n, assetsIn: 1_000n },
			{
				...curveDeps,
				quoteDepositFee: async () => 42n,
				claimableAcross: async () => 0n,
				quoteDepositPlan: stubMultiVaultQuote,
			} as Parameters<typeof dynamicFeeCurvePrepareDepositTx>[2]
		);

		expect(prepared.value).toBe(1_000n);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
		expect(prepared.args).toEqual([ACCOUNT, TERM_ID, 5n, 940n]);
		expect(prepared.quote.curveAddress).toBe(CURVE);
	});

	it('prepares a claim across the terms that actually hold a claimable balance', async () => {
		const prepared = await dynamicFeeCurvePrepareClaimTx(
			curveReadConfig,
			{ account: ACCOUNT, termIds: [TERM_ID, TERM_ID_2] },
			{
				claimableAcross: async () => 500n,
				pendingFor: async () => 250n,
				bankedEarnings: async () => 0n,
			}
		);

		expect(prepared.claimable.totalClaimable).toBe(500n);
		expect(prepared.args).toEqual([[TERM_ID, TERM_ID_2]]);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
		expect(prepared.isClaimable).toBe(true);
	});

	it('reports an empty claim as a state rather than throwing', async () => {
		const prepared = await dynamicFeeCurvePrepareClaimTx(
			curveReadConfig,
			{ account: ACCOUNT, termIds: [TERM_ID] },
			{
				claimableAcross: async () => 0n,
				pendingFor: async () => 0n,
				bankedEarnings: async () => 0n,
			}
		);

		expect(prepared.isClaimable).toBe(false);
		expect(prepared.claimable.totalClaimable).toBe(0n);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
	});

	it('de-duplicates term ids, which the contract reverts on', async () => {
		const prepared = await dynamicFeeCurvePrepareClaimTx(
			curveReadConfig,
			{ account: ACCOUNT, termIds: [TERM_ID, TERM_ID_2, TERM_ID] },
			{
				claimableAcross: async () => 10n,
				pendingFor: async () => 5n,
				bankedEarnings: async () => 0n,
			}
		);

		expect(prepared.args).toEqual([[TERM_ID, TERM_ID_2]]);
	});

	it('reports claimable state across terms without preparing a transaction', async () => {
		const result = await dynamicFeeCurveGetClaimableAcrossTerms(
			curveReadConfig,
			{ account: ACCOUNT, termIds: [TERM_ID] },
			{
				claimableAcross: async () => 10n,
				pendingFor: async () => 10n,
				bankedEarnings: async () => 4n,
			}
		);

		expect(result.totalClaimable).toBe(10n);
		expect(result.claimableTermIds).toEqual([TERM_ID]);
		// The settled half is reported separately rather than folded into every per-term answer.
		expect(result.bankedEarnings).toBe(4n);
		expect(result.pendingByTermId).toEqual([{ termId: TERM_ID, pending: 10n }]);
	});

	it('filters claimableTermIds to only the terms with nonzero per-term pending — not just echoing every candidate', async () => {
		const result = await dynamicFeeCurveGetClaimableAcrossTerms(
			curveReadConfig,
			{ account: ACCOUNT, termIds: [TERM_ID, TERM_ID_2] },
			{
				claimableAcross: async () => 300n,
				bankedEarnings: async () => 0n,
				pendingFor: async (_config, inputs) => {
					const [, termId] = inputs.args;
					// Only TERM_ID has pending; TERM_ID_2 is empty even though claimableAcross
					// (which folds in the banked balance) is nonzero.
					return termId === TERM_ID ? 300n : 0n;
				},
			}
		);

		expect(result.totalClaimable).toBe(300n);
		expect(result.claimableTermIds).toEqual([TERM_ID]);
	});

	it("charges the withdrawal fee at the holder's lot tiers, not the vault's", async () => {
		const quote = await dynamicFeeCurveQuoteRedeemPlan(
			{ multiVault, bondingCurveRegistry },
			{ termId: TERM_ID, curveId: 5n, account: ACCOUNT, sharesIn: 500n },
			{
				...curveDeps,
				// The vault has fallen back into tier 0 while this holder still holds lots at 3 and 1.
				vaultStake: async () => 10n,
				userLots: async () =>
					[
						[3n, 1n],
						[400n, 100n],
					] as never,
				quoteRedeemPlan: stubMultiVaultRedeemQuote,
			} as Parameters<typeof dynamicFeeCurveQuoteRedeemPlan>[2]
		);

		expect(quote.topTier).toBe(3n);
		expect(quote.lots).toEqual([
			{ tier: 3n, stake: 400n },
			{ tier: 1n, stake: 100n },
		]);
		expect(quote.vaultTier).toBe(0n);
		expect(quote.usesVaultTierFallback).toBe(false);
		expect(quote.multiVaultQuote.curveFee).toBe(40n);
	});

	it("falls back to the vault's tier for an account holding no lot", async () => {
		const quote = await dynamicFeeCurveQuoteRedeemPlan(
			{ multiVault, bondingCurveRegistry },
			{ termId: TERM_ID, curveId: 5n, account: ACCOUNT, sharesIn: 500n },
			{
				...curveDeps,
				vaultStake: async () => 1_200n,
				quoteRedeemPlan: stubMultiVaultRedeemQuote,
			} as Parameters<typeof dynamicFeeCurveQuoteRedeemPlan>[2]
		);

		expect(quote.usesVaultTierFallback).toBe(true);
		expect(quote.lots).toEqual([]);
		expect(quote.topTier).toBe(DYNAMIC_FEE_NO_LOT);
	});

	it("prepares redeem calldata floored against the account's own payout", async () => {
		const prepared = await dynamicFeeCurvePrepareRedeemTx(
			{ multiVault, bondingCurveRegistry },
			{
				receiver: ACCOUNT,
				termId: TERM_ID,
				curveId: 5n,
				account: ACCOUNT,
				sharesIn: 500n,
			},
			{
				...curveDeps,
				userLots: async () => [[3n], [400n]] as never,
				quoteRedeemPlan: stubMultiVaultRedeemQuote,
			} as Parameters<typeof dynamicFeeCurvePrepareRedeemTx>[2]
		);

		expect(prepared.args).toEqual([ACCOUNT, TERM_ID, 5n, 500n, 930n]);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
		expect(prepared.quote.topTier).toBe(3n);
	});

	describe('dynamicFeeCurveProjectDepositEarnings: a depositor topping up a lot with pending earnings', () => {
		// The depositor holds 500 at tier 0, whose accumulator stands at 2 per share: the lot has
		// accumulated 1_000 against a stored debt of 400, so 600 is pending. The vault sits at 500, so
		// the deposit's first band lands on that lot, and `_applyDepositBand` settles it first.
		const projectionDeps = {
			...curveDeps,
			vaultStake: async () => 500n,
			userLots: async () => [[0n], [500n]] as never,
			tierStake: async (_config: ReadConfig, inputs: { args: readonly unknown[] }) =>
				inputs.args[1] === 0n ? 500n : 0n,
			accFeePerShare: async (_config: ReadConfig, inputs: { args: readonly unknown[] }) =>
				inputs.args[1] === 0n ? 2n * 10n ** 18n : 0n,
			quoteDepositFee: async () => 42n,
			claimableAcross: async () => 0n,
			quoteDepositPlan: stubMultiVaultQuote,
		};

		it('reports the pending amount the chain banks, read from the stored lot debt', async () => {
			const projection = await dynamicFeeCurveProjectDepositEarnings(
				{ multiVault, bondingCurveRegistry },
				{ termId: TERM_ID, curveId: 5n, assetsIn: 1_000n, depositor: ACCOUNT },
				{
					...projectionDeps,
					lotRewardDebt: async () => 400n,
				} as Parameters<typeof dynamicFeeCurveProjectDepositEarnings>[2]
			);

			expect(projection.distribution.banked).toBe(600n);
		});

		it('without the debt read, checkpoints the lot at the current accumulator and reports nothing banked', async () => {
			const projection = await dynamicFeeCurveProjectDepositEarnings(
				{ multiVault, bondingCurveRegistry },
				{ termId: TERM_ID, curveId: 5n, assetsIn: 1_000n, depositor: ACCOUNT },
				projectionDeps as Parameters<typeof dynamicFeeCurveProjectDepositEarnings>[2]
			);

			expect(projection.distribution.banked).toBe(0n);
		});
	});
});

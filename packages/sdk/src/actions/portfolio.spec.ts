import type { ReadConfig } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import { portfolioGetActionableState, portfolioGetIntuitionPositionsSnapshot } from './portfolio';

const ACCOUNT = '0x8888888888888888888888888888888888888888' as Address;
const MULTIVAULT = '0x9999999999999999999999999999999999999999' as Address;
const TRUST_BONDING = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
const WRAPPED_TRUST = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address;
const TERM_ID = `0x${'cd'.repeat(32)}` as Hex;

const multiVaultConfig = { address: MULTIVAULT } as ReadConfig;
const trustBondingConfig = { address: TRUST_BONDING } as ReadConfig;
const wrappedTrustConfig = { address: WRAPPED_TRUST } as ReadConfig;

describe('portfolio SDK actions', () => {
	it('builds aggregated intuition position snapshot', async () => {
		const snapshot = await portfolioGetIntuitionPositionsSnapshot(
			{ multiVault: multiVaultConfig, trustBonding: trustBondingConfig },
			{ account: ACCOUNT, positions: [{ termId: TERM_ID, curveId: 1n }] },
			{
				getUserPositionSnapshot: async () => ({
					account: ACCOUNT,
					termId: TERM_ID,
					curveId: 1n,
					shares: 100n,
					maxRedeemShares: 80n,
					estimatedAssetsForCurrentShares: 150n,
					estimatedAssetsForMaxRedeem: 120n,
					currentSharePrice: 1n,
					vaultTotalAssets: 10_000n,
					vaultTotalShares: 5_000n,
				}),
				getRewardsDashboard: async () => ({
					account: ACCOUNT,
					currentEpoch: 10n,
					previousEpoch: 9n,
					currentEpochEndTimestamp: 1_800_000_000n,
					userInfo: {
						personalUtilization: 0n,
						eligibleRewards: 0n,
						maxRewards: 0n,
						lockedAmount: 0n,
						lockEnd: 0n,
						bondedBalance: 0n,
					},
					currentClaimableRewards: 10n,
					userApy: { currentApy: 1n, maxApy: 2n },
					systemApy: { currentApy: 3n, maxApy: 4n },
					hasClaimedPreviousEpochRewards: false,
				}),
				getLockStateSummary: async () => ({
					account: ACCOUNT,
					lockedAmount: 500n,
					lockEnd: 1_900_000_000n,
					nowTimestamp: 1_800_000_000n,
					isExpired: false,
					timeRemaining: 100_000_000n,
					nextActions: ['increaseAmount'],
				}),
				getClaimActionState: async () => {
					throw new Error('not used');
				},
				getWrappedTrustAllowance: async () => {
					throw new Error('not used');
				},
			} as Parameters<typeof portfolioGetIntuitionPositionsSnapshot>[2]
		);

		expect(snapshot.positions).toHaveLength(1);
		expect(snapshot.totals.totalShares).toBe(100n);
		expect(snapshot.totals.totalEstimatedAssets).toBe(150n);
		expect(snapshot.totals.totalEstimatedRedeemableAssets).toBe(120n);
	});

	it('returns actionable state with claim, approval, and redeem CTAs', async () => {
		const actionable = await portfolioGetActionableState(
			{
				multiVault: multiVaultConfig,
				trustBonding: trustBondingConfig,
				wrappedTrust: wrappedTrustConfig,
			},
			{
				account: ACCOUNT,
				positions: [{ termId: TERM_ID, curveId: 1n }],
				expectedWrappedTrustSpend: 1_000n,
			},
			{
				getClaimActionState: async () => ({
					account: ACCOUNT,
					recipient: ACCOUNT,
					currentEpoch: 10n,
					previousEpoch: 9n,
					claimableRewards: 100n,
					hasClaimedPreviousEpochRewards: false,
					canClaim: true,
					reason: 'can-claim',
					ctaLabel: 'Claim rewards',
				}),
				getLockStateSummary: async () => ({
					account: ACCOUNT,
					lockedAmount: 0n,
					lockEnd: 0n,
					nowTimestamp: 0n,
					isExpired: true,
					timeRemaining: 0n,
					nextActions: ['createLock'],
				}),
				getUserPositionSnapshot: async () => ({
					account: ACCOUNT,
					termId: TERM_ID,
					curveId: 1n,
					shares: 100n,
					maxRedeemShares: 20n,
					estimatedAssetsForCurrentShares: 100n,
					estimatedAssetsForMaxRedeem: 25n,
					currentSharePrice: 1n,
					vaultTotalAssets: 1n,
					vaultTotalShares: 1n,
				}),
				getRewardsDashboard: async () => {
					throw new Error('not used');
				},
				getWrappedTrustAllowance: async () => 100n,
			} as Parameters<typeof portfolioGetActionableState>[2]
		);

		expect(actionable.approval.checked).toBe(true);
		expect(actionable.approval.required).toBe(true);
		expect(actionable.redeemablePositions[0]?.canRedeem).toBe(true);
		expect(actionable.prioritizedCtas).toEqual([
			'claim-rewards',
			'approve-wrapped-trust',
			'redeem-position',
			'create-lock',
		]);
	});

	it('throws for negative expectedWrappedTrustSpend', async () => {
		await expect(
			portfolioGetActionableState(
				{
					multiVault: multiVaultConfig,
					trustBonding: trustBondingConfig,
					wrappedTrust: wrappedTrustConfig,
				},
				{
					account: ACCOUNT,
					positions: [{ termId: TERM_ID, curveId: 1n }],
					expectedWrappedTrustSpend: -1n,
				},
				{
					getClaimActionState: async () => {
						throw new Error('not used');
					},
					getLockStateSummary: async () => {
						throw new Error('not used');
					},
					getUserPositionSnapshot: async () => {
						throw new Error('not used');
					},
					getRewardsDashboard: async () => {
						throw new Error('not used');
					},
					getWrappedTrustAllowance: async () => {
						throw new Error('not used');
					},
				} as Parameters<typeof portfolioGetActionableState>[2]
			)
		).rejects.toThrow('expectedWrappedTrustSpend must be greater than or equal to 0.');
	});
});

import type { ReadConfig, WriteConfig } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import {
	trustBondingClaimAndRestakePlan,
	trustBondingGetClaimActionState,
	trustBondingGetEpochRewardsTimeline,
	trustBondingGetLockStateSummary,
	trustBondingGetRewardsDashboard,
	trustBondingPrepareLockAction,
} from './trust-bonding';

const ACCOUNT = '0x3333333333333333333333333333333333333333' as Address;
const RECIPIENT = '0x5555555555555555555555555555555555555555' as Address;
const TRUST_BONDING = '0x4444444444444444444444444444444444444444' as Address;
const MULTIVAULT = '0x6666666666666666666666666666666666666666' as Address;
const WRAPPED_TRUST = '0x7777777777777777777777777777777777777777' as Address;
const TERM_ID = `0x${'12'.repeat(32)}` as Hex;

const readConfig = { address: TRUST_BONDING } as ReadConfig;
const multiVaultWriteConfig = { address: MULTIVAULT } as WriteConfig;

describe('trust bonding SDK actions', () => {
	it('builds a rewards dashboard payload from multiple contract reads', async () => {
		const dashboard = await trustBondingGetRewardsDashboard(readConfig, { account: ACCOUNT }, {
			currentEpoch: async () => 12n,
			previousEpoch: async () => 11n,
			epochTimestampEnd: async () => 1_700_000_000n,
			getUserInfo: async () =>
				({
					personalUtilization: 10n,
					eligibleRewards: 20n,
					maxRewards: 30n,
					lockedAmount: 40n,
					lockEnd: 50n,
					bondedBalance: 60n,
					0: 10n,
					1: 20n,
					2: 30n,
					3: 40n,
					4: 50n,
					5: 60n,
					length: 6,
				}) as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint],
			getUserCurrentClaimableRewards: async () => 123n,
			getUserApy: async () => [450n, 900n] as const,
			getSystemApy: async () => [300n, 700n] as const,
			hasClaimedRewardsForEpoch: async () => true,
		} as Parameters<typeof trustBondingGetRewardsDashboard>[2]);

		expect(dashboard.currentEpoch).toBe(12n);
		expect(dashboard.previousEpoch).toBe(11n);
		expect(dashboard.currentClaimableRewards).toBe(123n);
		expect(dashboard.userInfo.lockedAmount).toBe(40n);
		expect(dashboard.userApy).toEqual({ currentApy: 450n, maxApy: 900n });
		expect(dashboard.systemApy).toEqual({ currentApy: 300n, maxApy: 700n });
		expect(dashboard.hasClaimedPreviousEpochRewards).toBe(true);
	});

	it('returns invalid-recipient state before any additional reads', async () => {
		const state = await trustBondingGetClaimActionState(
			readConfig,
			{ account: ACCOUNT, recipient: 'not-an-address' },
			{
				currentEpoch: async () => 5n,
				previousEpoch: async () => 4n,
				epochTimestampEnd: async () => 0n,
				getUserInfo: async () => [0n, 0n, 0n, 0n, 0n, 0n] as const,
				getUserCurrentClaimableRewards: async () => 0n,
				getUserApy: async () => [0n, 0n] as const,
				getSystemApy: async () => [0n, 0n] as const,
				hasClaimedRewardsForEpoch: async () => false,
			} as Parameters<typeof trustBondingGetClaimActionState>[2]
		);

		expect(state.canClaim).toBe(false);
		expect(state.reason).toBe('invalid-recipient');
		expect(state.ctaLabel).toBe('Enter valid recipient');
		expect(state.recipient).toBeNull();
	});

	it('returns too-early when the first epoch has not completed', async () => {
		const state = await trustBondingGetClaimActionState(readConfig, { account: ACCOUNT }, {
			currentEpoch: async () => 0n,
			previousEpoch: async () => 0n,
			epochTimestampEnd: async () => 0n,
			getUserInfo: async () => [0n, 0n, 0n, 0n, 0n, 0n] as const,
			getUserCurrentClaimableRewards: async () => 0n,
			getUserApy: async () => [0n, 0n] as const,
			getSystemApy: async () => [0n, 0n] as const,
			hasClaimedRewardsForEpoch: async () => false,
		} as Parameters<typeof trustBondingGetClaimActionState>[2]);

		expect(state.reason).toBe('too-early');
		expect(state.canClaim).toBe(false);
		expect(state.previousEpoch).toBeNull();
	});

	it('returns can-claim when rewards are available and not claimed', async () => {
		const state = await trustBondingGetClaimActionState(
			readConfig,
			{ account: ACCOUNT, recipient: ACCOUNT },
			{
				currentEpoch: async () => 8n,
				previousEpoch: async () => 7n,
				epochTimestampEnd: async () => 0n,
				getUserInfo: async () => [0n, 0n, 0n, 0n, 0n, 0n] as const,
				getUserCurrentClaimableRewards: async () => 1_000n,
				getUserApy: async () => [0n, 0n] as const,
				getSystemApy: async () => [0n, 0n] as const,
				hasClaimedRewardsForEpoch: async () => false,
			} as Parameters<typeof trustBondingGetClaimActionState>[2]
		);

		expect(state.reason).toBe('can-claim');
		expect(state.canClaim).toBe(true);
		expect(state.ctaLabel).toBe('Claim rewards');
		expect(state.previousEpoch).toBe(7n);
		expect(state.claimableRewards).toBe(1_000n);
	});

	it('routes lock action to increaseAmountAndTime when both amount and unlock time increase', async () => {
		const action = await trustBondingPrepareLockAction(
			readConfig,
			{
				account: ACCOUNT,
				amountDelta: 100n,
				unlockTime: 1_800_000_000n,
				nowTimestamp: 1_700_000_000n,
			},
			{
				locked: async () => [1_000n, 1_750_000_000n] as const,
				lockedEnd: async () => 1_750_000_000n,
			} as Parameters<typeof trustBondingPrepareLockAction>[2]
		);

		expect(action.action).toBe('increaseAmountAndTime');
		expect(action.args).toEqual([100n, 1_800_000_000n]);
		expect(action.calldata.startsWith('0x')).toBe(true);
	});

	it('routes lock action to withdrawAndCreateLock when previous lock is expired', async () => {
		const action = await trustBondingPrepareLockAction(
			readConfig,
			{
				account: ACCOUNT,
				amountDelta: 250n,
				unlockTime: 1_900_000_000n,
				nowTimestamp: 1_800_000_000n,
			},
			{
				locked: async () => [1_000n, 1_700_000_000n] as const,
				lockedEnd: async () => 1_700_000_000n,
			} as Parameters<typeof trustBondingPrepareLockAction>[2]
		);

		expect(action.action).toBe('withdrawAndCreateLock');
		expect(action.args).toEqual([250n, 1_900_000_000n]);
		expect(action.calldata.startsWith('0x')).toBe(true);
	});

	it('builds claim and restake plan for multivault target', async () => {
		const plan = await trustBondingClaimAndRestakePlan(
			readConfig,
			{
				account: ACCOUNT,
				recipient: ACCOUNT,
				target: {
					kind: 'multivault',
					multiVaultConfig: multiVaultWriteConfig,
					termId: TERM_ID,
					curveId: 1n,
					slippageBps: 100n,
				},
			},
			{
				getClaimActionState: async () => ({
					account: ACCOUNT,
					recipient: ACCOUNT,
					currentEpoch: 10n,
					previousEpoch: 9n,
					claimableRewards: 1_000n,
					hasClaimedPreviousEpochRewards: false,
					canClaim: true,
					reason: 'can-claim',
					ctaLabel: 'Claim rewards',
				}),
				previewDeposit: async () => [500n, 990n] as const,
			} as Parameters<typeof trustBondingClaimAndRestakePlan>[2]
		);

		expect(plan.target).toBe('multivault');
		expect(plan.steps.map((step) => step.type)).toEqual(['claimRewards', 'multiVaultDeposit']);
		expect(plan.steps[1]?.value).toBe(1_000n);
		expect(plan.minSharesOut).toBe(495n);
	});

	it('builds claim and restake plan for trust-bonding target', async () => {
		const plan = await trustBondingClaimAndRestakePlan(
			readConfig,
			{
				account: ACCOUNT,
				recipient: ACCOUNT,
				target: {
					kind: 'trust-bonding',
					wrappedTrustAddress: WRAPPED_TRUST,
				},
			},
			{
				getClaimActionState: async () => ({
					account: ACCOUNT,
					recipient: ACCOUNT,
					currentEpoch: 10n,
					previousEpoch: 9n,
					claimableRewards: 2_000n,
					hasClaimedPreviousEpochRewards: false,
					canClaim: true,
					reason: 'can-claim',
					ctaLabel: 'Claim rewards',
				}),
				previewDeposit: async () => {
					throw new Error('not used');
				},
			} as Parameters<typeof trustBondingClaimAndRestakePlan>[2]
		);

		expect(plan.target).toBe('trust-bonding');
		expect(plan.steps.map((step) => step.type)).toEqual([
			'claimRewards',
			'wrappedTrustDeposit',
			'wrappedTrustApprove',
			'trustBondingDepositFor',
		]);
		expect(plan.steps[1]?.value).toBe(2_000n);
	});

	it('returns lock state summary with next actions', async () => {
		const summary = await trustBondingGetLockStateSummary(
			readConfig,
			{ account: ACCOUNT, nowTimestamp: 1_700_000_000n },
			{
				locked: async () => [500n, 1_750_000_000n] as const,
				lockedEnd: async () => 1_750_000_000n,
			} as Parameters<typeof trustBondingGetLockStateSummary>[2]
		);

		expect(summary.isExpired).toBe(false);
		expect(summary.timeRemaining).toBe(50_000_000n);
		expect(summary.nextActions).toEqual([
			'increaseAmount',
			'increaseUnlockTime',
			'increaseAmountAndTime',
		]);
	});

	it('builds epoch rewards timeline payload', async () => {
		const timeline = await trustBondingGetEpochRewardsTimeline(
			readConfig,
			{ account: ACCOUNT, startEpoch: 6n, endEpoch: 7n },
			{
				currentEpoch: async () => 8n,
				userEligibleRewardsForEpoch: async (_, inputs) => {
					const epoch = inputs.args[1] as bigint;
					return epoch * 100n;
				},
				hasClaimedRewardsForEpoch: async (_, inputs) => {
					const epoch = inputs.args[1] as bigint;
					return epoch === 6n;
				},
				getUserRewardsForEpoch: async (_, inputs) => {
					const epoch = inputs.args[1] as bigint;
					return [epoch * 10n, epoch * 20n] as const;
				},
				getPersonalUtilizationRatio: async (_, inputs) => {
					const epoch = inputs.args[1] as bigint;
					return epoch * 5n;
				},
				getSystemUtilizationRatio: async (_, inputs) => {
					const epoch = inputs.args[0] as bigint;
					return epoch * 6n;
				},
			} as Parameters<typeof trustBondingGetEpochRewardsTimeline>[2]
		);

		expect(timeline.points).toHaveLength(2);
		expect(timeline.points[0]?.statusLabel).toBe('claimed');
		expect(timeline.points[1]?.statusLabel).toBe('claimable');
		expect(timeline.totalCurrentRewards).toBe(130n);
		expect(timeline.totalMaxRewards).toBe(260n);
	});

	it('throws when epoch rewards timeline range exceeds max supported window', async () => {
		await expect(
			trustBondingGetEpochRewardsTimeline(
				readConfig,
				{ account: ACCOUNT, startEpoch: 0n, endEpoch: 100n },
				{
					currentEpoch: async () => 200n,
					userEligibleRewardsForEpoch: async () => 0n,
					hasClaimedRewardsForEpoch: async () => false,
					getUserRewardsForEpoch: async () => [0n, 0n] as const,
					getPersonalUtilizationRatio: async () => 0n,
					getSystemUtilizationRatio: async () => 0n,
				} as Parameters<typeof trustBondingGetEpochRewardsTimeline>[2]
			)
		).rejects.toThrow('Requested epoch range is too large.');
	});
});

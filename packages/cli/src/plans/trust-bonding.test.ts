import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { resolveAgentActionTarget } from '../schema';
import {
	buildTrustBondingClaimAndRestakePlan,
	buildTrustBondingClaimPlan,
	buildTrustBondingLockPlan,
} from './trust-bonding';

const ACCOUNT = '0x3333333333333333333333333333333333333333' as Address;
const TRUST_BONDING = '0x4444444444444444444444444444444444444444' as Address;
const WRAPPED_TRUST = '0x5555555555555555555555555555555555555555' as Address;
const TERM_ID = `0x${'12'.repeat(32)}` as Hex;

describe('trust bonding plans', () => {
	it('builds a lock lifecycle envelope from current lock state', async () => {
		const trustBondingTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'trustbonding',
		});
		const envelope = await buildTrustBondingLockPlan({
			trustBondingAddress: TRUST_BONDING,
			account: ACCOUNT,
			amountDelta: 100n,
			unlockTime: 1_800_000_000n,
			nowTimestamp: 1_700_000_000n,
			readContext: {
				lockedAmount: 1_000n,
				lockEnd: 1_750_000_000n,
			},
		});

		expect(envelope.action).toBe('trustbonding.lockAction');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.id).toBe('increase-amount-and-time');
		expect(envelope.steps[0]?.to).toBe(trustBondingTarget.address);
		expect(envelope.steps[0]?.target).toEqual(trustBondingTarget);
		expect(envelope.estimates).toMatchObject({
			action: 'increaseAmountAndTime',
			lockedAmount: '1000',
			lockEnd: '1750000000',
		});
	});

	it('builds a claim envelope when rewards are claimable', async () => {
		const trustBondingTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'trustbonding',
		});
		const envelope = await buildTrustBondingClaimPlan({
			trustBondingAddress: TRUST_BONDING,
			account: ACCOUNT,
			recipient: ACCOUNT,
			readContext: {
				currentEpoch: 8n,
				previousEpoch: 7n,
				claimableRewards: 1_000n,
				hasClaimedPreviousEpochRewards: false,
			},
		});

		expect(envelope.action).toBe('trustbonding.claim');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.id).toBe('claim-rewards');
		expect(envelope.steps[0]?.to).toBe(trustBondingTarget.address);
		expect(envelope.steps[0]?.target).toEqual(trustBondingTarget);
		expect(envelope.estimates).toMatchObject({
			claimableRewards: '1000',
			previousEpoch: '7',
		});
	});

	it('builds a claim-and-restake envelope for the trust-bonding target', async () => {
		const trustBondingTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'trustbonding',
		});
		const wrappedTrustTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'wrapped-trust',
		});
		const envelope = await buildTrustBondingClaimAndRestakePlan({
			trustBondingAddress: TRUST_BONDING,
			account: ACCOUNT,
			recipient: ACCOUNT,
			readContext: {
				currentEpoch: 10n,
				previousEpoch: 9n,
				claimableRewards: 2_000n,
				hasClaimedPreviousEpochRewards: false,
			},
			target: {
				kind: 'trust-bonding',
				wrappedTrustAddress: WRAPPED_TRUST,
			},
		});

		expect(envelope.action).toBe('trustbonding.claimAndRestake');
		expect(envelope.steps.map((step) => step.id)).toEqual([
			'claimRewards-1',
			'wrappedTrustDeposit-2',
			'wrappedTrustApprove-3',
			'trustBondingDepositFor-4',
		]);
		expect(envelope.steps[0]?.target).toEqual(trustBondingTarget);
		expect(envelope.steps[1]?.target).toEqual(wrappedTrustTarget);
		expect(envelope.steps[2]?.target).toEqual(wrappedTrustTarget);
		expect(envelope.steps[3]?.target).toEqual(trustBondingTarget);
		expect(envelope.steps[1]?.value).toBe('2000');
		expect(envelope.estimates).toMatchObject({
			claimableRewards: '2000',
			target: 'trust-bonding',
		});
	});

	it('rejects invalid recipient claims', async () => {
		await expect(
			buildTrustBondingClaimPlan({
				trustBondingAddress: TRUST_BONDING,
				account: ACCOUNT,
				recipient: 'not-an-address',
				readContext: {
					currentEpoch: 5n,
				},
			})
		).rejects.toThrow('Rewards are not claimable in the current state (invalid-recipient).');
	});

	it('rejects negative lock amount input before state reads', async () => {
		await expect(
			buildTrustBondingLockPlan({
				trustBondingAddress: TRUST_BONDING,
				account: ACCOUNT,
				amountDelta: -1n,
			})
		).rejects.toThrow('amountDelta must be greater than or equal to 0.');
	});

	it('builds a create-lock envelope when no existing lock is present', async () => {
		const envelope = await buildTrustBondingLockPlan({
			trustBondingAddress: TRUST_BONDING,
			account: ACCOUNT,
			amountDelta: 250n,
			unlockTime: 1_800_000_000n,
			nowTimestamp: 1_700_000_000n,
			readContext: {
				lockedAmount: 0n,
				lockEnd: 0n,
			},
		});

		expect(envelope.steps[0]?.id).toBe('create-lock');
		expect(envelope.estimates).toMatchObject({
			action: 'createLock',
			isExpired: true,
			lockedAmount: '0',
		});
	});

	it('builds a claim-and-restake envelope for the multivault target', async () => {
		const multiVaultTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});
		const envelope = await buildTrustBondingClaimAndRestakePlan({
			trustBondingAddress: TRUST_BONDING,
			account: ACCOUNT,
			readContext: {
				currentEpoch: 11n,
				previousEpoch: 10n,
				claimableRewards: 3_000n,
				hasClaimedPreviousEpochRewards: false,
			},
			target: {
				kind: 'multivault',
				multiVaultAddress: multiVaultTarget.address,
				termId: TERM_ID,
				curveId: 1n,
				slippageBps: 100n,
				readContext: {
					previewDeposit: {
						sharesOut: 1_500n,
						assetsAfterFees: 2_970n,
					},
				},
			},
		});

		expect(envelope.steps.map((step) => step.id)).toEqual([
			'claimRewards-1',
			'multiVaultDeposit-2',
		]);
		expect(envelope.steps[1]?.target).toEqual(multiVaultTarget);
		expect(envelope.steps[1]?.value).toBe('3000');
		expect(envelope.estimates).toMatchObject({
			target: 'multivault',
			claimableRewards: '3000',
			estimatedSharesOut: '1500',
		});
	});

	it('supports Intuition testnet targets for claim plans', async () => {
		const trustBondingTarget = resolveAgentActionTarget({
			chainId: 13579,
			contract: 'trustbonding',
		});
		const envelope = await buildTrustBondingClaimPlan({
			chainId: 13579,
			trustBondingAddress: TRUST_BONDING,
			account: ACCOUNT,
			recipient: ACCOUNT,
			readContext: {
				currentEpoch: 14n,
				previousEpoch: 13n,
				claimableRewards: 500n,
				hasClaimedPreviousEpochRewards: false,
			},
		});

		expect(envelope.steps[0]?.target).toEqual(trustBondingTarget);
		expect(envelope.steps[0]?.target.chainId).toBe(13579);
	});

	it('rejects claim-and-restake plans when the claim recipient differs from the account', async () => {
		await expect(
			buildTrustBondingClaimAndRestakePlan({
				trustBondingAddress: TRUST_BONDING,
				account: ACCOUNT,
				recipient: '0x9999999999999999999999999999999999999999' as Address,
				readContext: {
					currentEpoch: 12n,
					previousEpoch: 11n,
					claimableRewards: 1_000n,
					hasClaimedPreviousEpochRewards: false,
				},
				target: {
					kind: 'trust-bonding',
					wrappedTrustAddress: WRAPPED_TRUST,
				},
			})
		).rejects.toThrow('Claim recipient must match account for claim-and-restake plans.');
	});
});

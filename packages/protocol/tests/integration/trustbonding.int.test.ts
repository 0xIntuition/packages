import { type Address, parseEther } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	TrustAbi,
	TrustBondingAbi,
	trustBondingCurrentEpoch,
	trustBondingEmissionsForEpoch,
	trustBondingEpochAtTimestamp,
	trustBondingEpochLength,
	trustBondingEpochsPerYear,
	trustBondingEpochTimestampEnd,
	trustBondingGetPersonalUtilizationRatio,
	trustBondingGetSystemApy,
	trustBondingGetSystemUtilizationRatio,
	trustBondingGetUnclaimedRewardsForEpoch,
	trustBondingGetUserApy,
	trustBondingGetUserCurrentClaimableRewards,
	trustBondingGetUserInfo,
	trustBondingGetUserRewardsForEpoch,
	trustBondingHasClaimedRewardsForEpoch,
	trustBondingPreviousEpoch,
	trustBondingTotalBondedBalance,
	trustBondingTotalBondedBalanceAtEpochEnd,
	trustBondingTotalLocked,
	trustBondingUserBondedBalanceAtEpochEnd,
	trustBondingUserEligibleRewardsForEpoch,
	wrappedTrustDeposit,
} from '../../src';
import { deployCoreContracts } from '../helpers/deploy-multivault';
import { publicClient, walletClient } from '../helpers/utils';

let trustBondingAddress: Address;
let trustTokenAddress: Address;
let wrappedTrustAddress: Address | undefined;
let hasBondedState = false;

const WEEK_SECONDS = 7n * 24n * 60n * 60n;

async function readTrustBondingDirect(functionName: string, args: readonly unknown[] = []) {
	return await publicClient.readContract({
		address: trustBondingAddress,
		abi: TrustBondingAbi,
		functionName: functionName as never,
		args: args as never,
	});
}

async function ensureBondedState() {
	const account = walletClient.account.address;
	const lockState = await readTrustBondingDirect('locked', [account]);
	const existingLocked = lockState[0] as bigint;

	if (existingLocked > 0n) {
		hasBondedState = true;
		return;
	}

	const desiredLockAmount = parseEther('5');
	let tokenBalance = await publicClient.readContract({
		address: trustTokenAddress,
		abi: TrustAbi,
		functionName: 'balanceOf',
		args: [account],
	});

	if (tokenBalance < desiredLockAmount) {
		if (!wrappedTrustAddress) {
			return;
		}

		const mintAmount = desiredLockAmount - tokenBalance;
		const depositHash = await wrappedTrustDeposit(
			{
				walletClient,
				publicClient,
				address: wrappedTrustAddress,
			},
			{
				args: [],
				value: mintAmount,
			}
		);
		await publicClient.waitForTransactionReceipt({ hash: depositHash });

		tokenBalance = await publicClient.readContract({
			address: trustTokenAddress,
			abi: TrustAbi,
			functionName: 'balanceOf',
			args: [account],
		});

		if (tokenBalance < desiredLockAmount) {
			throw new Error('Unable to mint enough TRUST for trustbonding lock setup.');
		}
	}

	const approveHash = await walletClient.writeContract({
		account: walletClient.account,
		address: trustTokenAddress,
		abi: TrustAbi,
		functionName: 'approve',
		args: [trustBondingAddress, desiredLockAmount],
	});
	await publicClient.waitForTransactionReceipt({ hash: approveHash });

	const minTime = await readTrustBondingDirect('MINTIME');
	const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
	const unlockTime =
		((latestBlock.timestamp + (minTime as bigint) + WEEK_SECONDS) / WEEK_SECONDS) * WEEK_SECONDS;

	const lockHash = await walletClient.writeContract({
		account: walletClient.account,
		address: trustBondingAddress,
		abi: TrustBondingAbi,
		functionName: 'create_lock',
		args: [desiredLockAmount, unlockTime],
	});
	await publicClient.waitForTransactionReceipt({ hash: lockHash });

	hasBondedState = true;
}

beforeAll(async () => {
	const deployment = await deployCoreContracts();
	trustBondingAddress = deployment.intuition.trustBonding;
	trustTokenAddress = deployment.trustToken;
	wrappedTrustAddress = deployment.wrappedTrust;

	await ensureBondedState();
}, 180000);

describe('TrustBonding', () => {
	it('exposes epoch and emission reads', async () => {
		const config = { publicClient, address: trustBondingAddress };

		const currentEpoch = await trustBondingCurrentEpoch(config);
		expect(currentEpoch).toEqual(await readTrustBondingDirect('currentEpoch'));

		const previousEpoch = await trustBondingPreviousEpoch(config);
		expect(previousEpoch).toEqual(await readTrustBondingDirect('previousEpoch'));
		expect(previousEpoch).toBeLessThanOrEqual(currentEpoch);

		const epochLength = await trustBondingEpochLength(config, { args: [] });
		expect(epochLength).toEqual(await readTrustBondingDirect('epochLength'));
		expect(epochLength).toBeGreaterThan(0n);

		const epochsPerYear = await trustBondingEpochsPerYear(config);
		expect(epochsPerYear).toEqual(await readTrustBondingDirect('epochsPerYear'));
		expect(epochsPerYear).toBeGreaterThan(0n);

		const epochEndTimestamp = await trustBondingEpochTimestampEnd(config, { args: [currentEpoch] });
		expect(epochEndTimestamp).toEqual(
			await readTrustBondingDirect('epochTimestampEnd', [currentEpoch])
		);

		const epochAtEnd = await trustBondingEpochAtTimestamp(config, { args: [epochEndTimestamp] });
		expect(epochAtEnd).toEqual(
			await readTrustBondingDirect('epochAtTimestamp', [epochEndTimestamp])
		);

		const emissions = await trustBondingEmissionsForEpoch(config, { args: [currentEpoch] });
		expect(emissions).toEqual(await readTrustBondingDirect('emissionsForEpoch', [currentEpoch]));
	});

	it('exposes user and utilization reads', async () => {
		const account = walletClient.account.address;
		const config = { publicClient, address: trustBondingAddress };
		const currentEpoch = await trustBondingCurrentEpoch(config);

		const userInfo = await trustBondingGetUserInfo(config, { args: [account] });
		expect(userInfo).toEqual(await readTrustBondingDirect('getUserInfo', [account]));

		const personalUtilization = await trustBondingGetPersonalUtilizationRatio(config, {
			args: [account, currentEpoch],
		});
		expect(personalUtilization).toEqual(
			await readTrustBondingDirect('getPersonalUtilizationRatio', [account, currentEpoch])
		);
		expect(personalUtilization).toBeGreaterThanOrEqual(0n);

		const systemUtilization = await trustBondingGetSystemUtilizationRatio(config, {
			args: [currentEpoch],
		});
		expect(systemUtilization).toEqual(
			await readTrustBondingDirect('getSystemUtilizationRatio', [currentEpoch])
		);
		expect(systemUtilization).toBeGreaterThanOrEqual(0n);

		const userApy = await trustBondingGetUserApy(config, { args: [account] });
		expect(userApy).toEqual(await readTrustBondingDirect('getUserApy', [account]));
		expect(userApy[1]).toBeGreaterThanOrEqual(userApy[0]);

		const userClaimableRewards = await trustBondingGetUserCurrentClaimableRewards(config, {
			args: [account],
		});
		expect(userClaimableRewards).toEqual(
			await readTrustBondingDirect('getUserCurrentClaimableRewards', [account])
		);

		const userRewards = await trustBondingGetUserRewardsForEpoch(config, {
			args: [account, currentEpoch],
		});
		expect(userRewards).toEqual(
			await readTrustBondingDirect('getUserRewardsForEpoch', [account, currentEpoch])
		);
		expect(userRewards[1]).toBeGreaterThanOrEqual(userRewards[0]);

		const userEligibleRewards = await trustBondingUserEligibleRewardsForEpoch(config, {
			args: [account, currentEpoch],
		});
		expect(userEligibleRewards).toEqual(
			await readTrustBondingDirect('userEligibleRewardsForEpoch', [account, currentEpoch])
		);

		const userBondedBalanceAtEpochEnd = await trustBondingUserBondedBalanceAtEpochEnd(config, {
			args: [account, currentEpoch],
		});
		expect(userBondedBalanceAtEpochEnd).toEqual(
			await readTrustBondingDirect('userBondedBalanceAtEpochEnd', [account, currentEpoch])
		);

		const hasClaimedRewards = await trustBondingHasClaimedRewardsForEpoch(config, {
			args: [account, currentEpoch],
		});
		expect(hasClaimedRewards).toEqual(
			await readTrustBondingDirect('hasClaimedRewardsForEpoch', [account, currentEpoch])
		);
		expect(typeof hasClaimedRewards).toBe('boolean');
	});

	it('exposes system totals, APY and unclaimed rewards', async () => {
		const config = { publicClient, address: trustBondingAddress };
		const currentEpoch = await trustBondingCurrentEpoch(config);

		const totalLocked = await trustBondingTotalLocked(config);
		expect(totalLocked).toEqual(await readTrustBondingDirect('totalLocked'));

		const totalBondedBalance = await trustBondingTotalBondedBalance(config);
		expect(totalBondedBalance).toEqual(await readTrustBondingDirect('totalBondedBalance'));

		const totalBondedBalanceAtEpochEnd = await trustBondingTotalBondedBalanceAtEpochEnd(config, {
			args: [currentEpoch],
		});
		expect(totalBondedBalanceAtEpochEnd).toEqual(
			await readTrustBondingDirect('totalBondedBalanceAtEpochEnd', [currentEpoch])
		);

		const systemApy = await trustBondingGetSystemApy(config);
		expect(systemApy).toEqual(await readTrustBondingDirect('getSystemApy'));
		expect(systemApy[1]).toBeGreaterThanOrEqual(systemApy[0]);

		const unclaimedRewardsCurrentEpoch = await trustBondingGetUnclaimedRewardsForEpoch(config, {
			args: [currentEpoch],
		});
		expect(unclaimedRewardsCurrentEpoch).toEqual(
			await readTrustBondingDirect('getUnclaimedRewardsForEpoch', [currentEpoch])
		);
		expect(unclaimedRewardsCurrentEpoch).toBe(0n);

		if (hasBondedState) {
			expect(totalLocked).toBeGreaterThan(0n);
			expect(totalBondedBalance).toBeGreaterThan(0n);
		}
	});
});

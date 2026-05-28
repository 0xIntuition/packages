import { type Address, parseEther } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	TrustAbi,
	TrustBondingAbi,
	trustBondingBalanceOf,
	trustBondingBalanceOfAtT,
	trustBondingClaimRewards,
	trustBondingCreateLock,
	trustBondingCurrentEpoch,
	trustBondingDepositFor,
	trustBondingGetLastUserSlope,
	trustBondingGetUserCurrentClaimableRewards,
	trustBondingHasClaimedRewardsForEpoch,
	trustBondingIncreaseAmount,
	trustBondingIncreaseAmountAndTime,
	trustBondingIncreaseUnlockTime,
	trustBondingLocked,
	trustBondingLockedEnd,
	trustBondingTotalSupplyAtT,
	trustBondingWithdraw,
	trustBondingWithdrawAndCreateLock,
	wrappedTrustDeposit,
} from '../../src';
import { deployCoreContracts } from '../helpers/deploy-multivault';
import { publicClient, userWalletClient, walletClient } from '../helpers/utils';

let trustBondingAddress: Address;
let trustTokenAddress: Address;
let wrappedTrustAddress: Address | undefined;
let userHasLock = false;

const WEEK_SECONDS = 7n * 24n * 60n * 60n;

async function readTrustBondingDirect(functionName: string, args: readonly unknown[] = []) {
	return await publicClient.readContract({
		address: trustBondingAddress,
		abi: TrustBondingAbi,
		functionName: functionName as never,
		args: args as never,
	});
}

beforeAll(async () => {
	const deployment = await deployCoreContracts();
	trustBondingAddress = deployment.intuition.trustBonding;
	trustTokenAddress = deployment.trustToken;
	wrappedTrustAddress = deployment.wrappedTrust;

	const user = userWalletClient.account.address;
	const targetUserTrustBalance = parseEther('30');

	let userTrustBalance = await publicClient.readContract({
		address: trustTokenAddress,
		abi: TrustAbi,
		functionName: 'balanceOf',
		args: [user],
	});

	if (userTrustBalance < targetUserTrustBalance) {
		const missingBalance = targetUserTrustBalance - userTrustBalance;

		if (wrappedTrustAddress) {
			const depositHash = await wrappedTrustDeposit(
				{
					address: wrappedTrustAddress,
					publicClient,
					walletClient: userWalletClient,
				},
				{
					args: [],
					value: missingBalance,
				}
			);
			await publicClient.waitForTransactionReceipt({ hash: depositHash });
		} else {
			const transferHash = await walletClient.writeContract({
				account: walletClient.account,
				address: trustTokenAddress,
				abi: TrustAbi,
				functionName: 'transfer',
				args: [user, missingBalance],
			});
			await publicClient.waitForTransactionReceipt({ hash: transferHash });
		}

		userTrustBalance = await publicClient.readContract({
			address: trustTokenAddress,
			abi: TrustAbi,
			functionName: 'balanceOf',
			args: [user],
		});
	}

	if (userTrustBalance < targetUserTrustBalance) {
		throw new Error('Unable to provision enough TRUST for trustbonding action tests.');
	}

	const approveHash = await userWalletClient.writeContract({
		account: userWalletClient.account,
		address: trustTokenAddress,
		abi: TrustAbi,
		functionName: 'approve',
		args: [trustBondingAddress, parseEther('30')],
	});
	await publicClient.waitForTransactionReceipt({ hash: approveHash });

	const userLockState = await trustBondingLocked(
		{ address: trustBondingAddress, publicClient },
		{ args: [user] }
	);
	userHasLock = (userLockState[0] as bigint) > 0n;

	if (!userHasLock) {
		const minTime = (await readTrustBondingDirect('MINTIME')) as bigint;
		const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
		const unlockTime =
			((latestBlock.timestamp + minTime + WEEK_SECONDS) / WEEK_SECONDS) * WEEK_SECONDS;

		const createHash = await trustBondingCreateLock(
			{ address: trustBondingAddress, publicClient, walletClient: userWalletClient },
			{ args: [parseEther('4'), unlockTime] }
		);
		await publicClient.waitForTransactionReceipt({ hash: createHash });
	}
}, 180000);

describe('TrustBonding additional wrappers', () => {
	it('exposes new lock and veTRUST read helpers', async () => {
		const user = userWalletClient.account.address;
		const config = { address: trustBondingAddress, publicClient };
		const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });

		const locked = await trustBondingLocked(config, { args: [user] });
		expect(locked).toEqual(await readTrustBondingDirect('locked', [user]));
		expect(locked[0]).toBeGreaterThan(0n);

		const lockedEnd = await trustBondingLockedEnd(config, { args: [user] });
		expect(lockedEnd).toEqual(await readTrustBondingDirect('locked__end', [user]));

		const balance = await trustBondingBalanceOf(config, { args: [user] });
		expect(balance).toEqual(await readTrustBondingDirect('balanceOf', [user]));

		const balanceAtT = await trustBondingBalanceOfAtT(config, {
			args: [user, latestBlock.timestamp],
		});
		expect(balanceAtT).toEqual(
			await readTrustBondingDirect('balanceOfAtT', [user, latestBlock.timestamp])
		);

		const totalSupplyAtT = await trustBondingTotalSupplyAtT(config, {
			args: [latestBlock.timestamp],
		});
		expect(totalSupplyAtT).toEqual(
			await readTrustBondingDirect('totalSupplyAtT', [latestBlock.timestamp])
		);

		const slope = await trustBondingGetLastUserSlope(config, { args: [user] });
		expect(slope).toEqual(await readTrustBondingDirect('get_last_user_slope', [user]));
	});

	it('supports increase amount, increase unlock time and combined increase wrappers', async () => {
		const user = userWalletClient.account.address;
		const config = { address: trustBondingAddress, publicClient, walletClient: userWalletClient };

		const lockBefore = await trustBondingLocked(
			{ address: trustBondingAddress, publicClient },
			{ args: [user] }
		);
		const amountBefore = lockBefore[0] as bigint;
		const endBefore = lockBefore[1] as bigint;

		const increaseAmountHash = await trustBondingIncreaseAmount(config, {
			args: [parseEther('1')],
		});
		await publicClient.waitForTransactionReceipt({ hash: increaseAmountHash });

		const maxTime = (await readTrustBondingDirect('MAXTIME')) as bigint;
		const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
		let nextUnlock = endBefore + WEEK_SECONDS;
		const maxUnlock = latestBlock.timestamp + maxTime;
		if (nextUnlock > maxUnlock) {
			nextUnlock = (maxUnlock / WEEK_SECONDS) * WEEK_SECONDS;
		}

		const increaseUnlockHash = await trustBondingIncreaseUnlockTime(config, {
			args: [nextUnlock],
		});
		await publicClient.waitForTransactionReceipt({ hash: increaseUnlockHash });

		const finalUnlock = nextUnlock + WEEK_SECONDS;
		const boundedFinalUnlock = finalUnlock > maxUnlock ? nextUnlock : finalUnlock;

		const increaseBothHash = await trustBondingIncreaseAmountAndTime(config, {
			args: [parseEther('1'), boundedFinalUnlock],
		});
		await publicClient.waitForTransactionReceipt({ hash: increaseBothHash });

		const lockAfter = await trustBondingLocked(
			{ address: trustBondingAddress, publicClient },
			{ args: [user] }
		);
		expect(lockAfter[0] as bigint).toBeGreaterThan(amountBefore);
		expect(lockAfter[1] as bigint).toBeGreaterThanOrEqual(nextUnlock);
	});

	it('supports deposit_for wrapper and claimRewards wrapper behavior', async () => {
		const user = userWalletClient.account.address;
		const readConfig = { address: trustBondingAddress, publicClient };

		const ownerApproveHash = await walletClient.writeContract({
			account: walletClient.account,
			address: trustTokenAddress,
			abi: TrustAbi,
			functionName: 'approve',
			args: [trustBondingAddress, parseEther('5')],
		});
		await publicClient.waitForTransactionReceipt({ hash: ownerApproveHash });

		const lockBefore = await trustBondingLocked(readConfig, { args: [user] });

		const depositForHash = await trustBondingDepositFor(
			{ address: trustBondingAddress, publicClient, walletClient },
			{ args: [user, parseEther('1')] }
		);
		await publicClient.waitForTransactionReceipt({ hash: depositForHash });

		const lockAfter = await trustBondingLocked(readConfig, { args: [user] });
		expect(lockAfter[0] as bigint).toBeGreaterThan(lockBefore[0] as bigint);

		const currentEpoch = await trustBondingCurrentEpoch(readConfig);
		const claimable = await trustBondingGetUserCurrentClaimableRewards(readConfig, {
			args: [user],
		});

		if (currentEpoch > 0n && claimable > 0n) {
			const claimedHash = await trustBondingClaimRewards(
				{ address: trustBondingAddress, publicClient, walletClient: userWalletClient },
				{ args: [user] }
			);
			await publicClient.waitForTransactionReceipt({ hash: claimedHash });

			const claimed = await trustBondingHasClaimedRewardsForEpoch(readConfig, {
				args: [user, currentEpoch - 1n],
			});
			expect(claimed).toBe(true);
		} else {
			await expect(
				trustBondingClaimRewards(
					{ address: trustBondingAddress, publicClient, walletClient: userWalletClient },
					{ args: [user] }
				)
			).rejects.toThrow();
		}
	});

	it('exposes expected revert path for withdraw flows before lock expiry', async () => {
		const config = { address: trustBondingAddress, publicClient, walletClient: userWalletClient };
		const minTime = (await readTrustBondingDirect('MINTIME')) as bigint;
		const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
		const unlockTime =
			((latestBlock.timestamp + minTime + WEEK_SECONDS) / WEEK_SECONDS) * WEEK_SECONDS;

		await expect(trustBondingWithdraw(config, { args: [] })).rejects.toThrow();
		await expect(
			trustBondingWithdrawAndCreateLock(config, { args: [parseEther('1'), unlockTime] })
		).rejects.toThrow();
	});
});

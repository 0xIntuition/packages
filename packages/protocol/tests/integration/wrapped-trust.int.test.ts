import { type Address, parseEther } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import { WrappedTrustAbi, wrappedTrustDeposit, wrappedTrustWithdraw } from '../../src';
import { deployCoreContracts } from '../helpers/deploy-multivault';
import { publicClient, walletClient } from '../helpers/utils';

let wrappedTrustAddress: Address | undefined;

beforeAll(async () => {
	const deployment = await deployCoreContracts();
	wrappedTrustAddress = deployment.wrappedTrust;
}, 180000);

describe('WrappedTrust', () => {
	it('deposits and withdraws when WrappedTrust is available', async () => {
		if (!wrappedTrustAddress) {
			expect(true).toBe(true);
			return;
		}

		const account = walletClient.account.address;
		const depositAmount = parseEther('1');
		const withdrawAmount = parseEther('0.4');

		const balanceBefore = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [account],
		});

		const depositHash = await wrappedTrustDeposit(
			{
				walletClient,
				publicClient,
				address: wrappedTrustAddress,
			},
			{
				args: [],
				value: depositAmount,
			}
		);
		await publicClient.waitForTransactionReceipt({ hash: depositHash });

		const balanceAfterDeposit = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [account],
		});
		expect(balanceAfterDeposit).toBe(balanceBefore + depositAmount);

		const withdrawHash = await wrappedTrustWithdraw(
			{
				walletClient,
				publicClient,
				address: wrappedTrustAddress,
			},
			{
				args: [withdrawAmount],
			}
		);
		await publicClient.waitForTransactionReceipt({ hash: withdrawHash });

		const balanceAfterWithdraw = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [account],
		});
		expect(balanceAfterWithdraw).toBe(balanceAfterDeposit - withdrawAmount);
	});
});

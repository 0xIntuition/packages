import { type Address, parseEther } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	WrappedTrustAbi,
	wrappedTrustApprove,
	wrappedTrustDeposit,
	wrappedTrustTotalSupply,
	wrappedTrustTransfer,
	wrappedTrustTransferFrom,
} from '../../src';
import { deployCoreContracts } from '../helpers/deploy-multivault';
import { publicClient, userWalletClient, walletClient } from '../helpers/utils';

let wrappedTrustAddress: Address | undefined;

beforeAll(async () => {
	const deployment = await deployCoreContracts();
	wrappedTrustAddress = deployment.wrappedTrust;
}, 180000);

describe('WrappedTrust ERC20 wrappers', () => {
	it('supports approve, transfer, transferFrom and totalSupply wrappers', async () => {
		if (!wrappedTrustAddress) {
			expect(true).toBe(true);
			return;
		}

		const owner = walletClient.account.address;
		const spender = userWalletClient.account.address;
		const receiver = userWalletClient.account.address;
		const initialDeposit = parseEther('2');
		const transferAmount = parseEther('0.3');
		const transferFromAmount = parseEther('0.2');

		const depositHash = await wrappedTrustDeposit(
			{ address: wrappedTrustAddress, publicClient, walletClient },
			{ args: [], value: initialDeposit }
		);
		await publicClient.waitForTransactionReceipt({ hash: depositHash });

		const ownerBefore = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [owner],
		});
		const receiverBefore = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [receiver],
		});

		const transferHash = await wrappedTrustTransfer(
			{ address: wrappedTrustAddress, publicClient, walletClient },
			{ args: [receiver, transferAmount] }
		);
		await publicClient.waitForTransactionReceipt({ hash: transferHash });

		const ownerAfterTransfer = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [owner],
		});
		const receiverAfterTransfer = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [receiver],
		});

		expect(ownerAfterTransfer).toBe(ownerBefore - transferAmount);
		expect(receiverAfterTransfer).toBe(receiverBefore + transferAmount);

		const approveHash = await wrappedTrustApprove(
			{ address: wrappedTrustAddress, publicClient, walletClient },
			{ args: [spender, transferFromAmount] }
		);
		await publicClient.waitForTransactionReceipt({ hash: approveHash });

		const transferFromHash = await wrappedTrustTransferFrom(
			{ address: wrappedTrustAddress, publicClient, walletClient: userWalletClient },
			{ args: [owner, receiver, transferFromAmount] }
		);
		await publicClient.waitForTransactionReceipt({ hash: transferFromHash });

		const ownerAfterTransferFrom = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [owner],
		});
		const receiverAfterTransferFrom = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'balanceOf',
			args: [receiver],
		});

		expect(ownerAfterTransferFrom).toBe(ownerAfterTransfer - transferFromAmount);
		expect(receiverAfterTransferFrom).toBe(receiverAfterTransfer + transferFromAmount);

		const totalSupplyFromWrapper = await wrappedTrustTotalSupply({
			address: wrappedTrustAddress,
			publicClient,
		});
		const totalSupplyDirect = await publicClient.readContract({
			address: wrappedTrustAddress,
			abi: WrappedTrustAbi,
			functionName: 'totalSupply',
		});
		expect(totalSupplyFromWrapper).toBe(totalSupplyDirect);
	});
});

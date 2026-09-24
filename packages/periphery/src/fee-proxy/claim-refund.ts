import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

/**
 * Simulates and submits a FeeProxy `claimRefund` transaction — withdraws the caller's
 * full pending refund balance from the pull-fallback ledger to the caller.
 * @param config Contract address and viem clients.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyClaimRefund(config: WriteConfig) {
	const { address, walletClient, publicClient } = config;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'claimRefund',
	});

	return await walletClient.writeContract(request);
}

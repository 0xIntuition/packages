import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyClaimRefundToInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'nonpayable', 'claimRefundTo'>;
};

/**
 * Simulates and submits a FeeProxy `claimRefundTo` transaction — withdraws the caller's full
 * pending refund balance to `recipient`. The recovery path for wallets whose own `receive`
 * reverts. Reverts `FeeProxy_NoRefundOwed` when nothing is owed.
 * @param config Contract address and viem clients.
 * @param inputs Function args.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyClaimRefundTo(
	config: WriteConfig,
	inputs: FeeProxyClaimRefundToInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'claimRefundTo',
		args,
	});

	return await walletClient.writeContract(request);
}

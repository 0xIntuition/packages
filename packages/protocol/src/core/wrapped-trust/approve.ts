import type { ContractFunctionArgs } from 'viem';

import { WrappedTrustAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type WrappedTrustApproveInputs = {
	args: ContractFunctionArgs<typeof WrappedTrustAbi, 'nonpayable', 'approve'>;
};

/**
 * Simulates and submits a WrappedTrust `approve` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for approval.
 * @returns Transaction hash from the wallet client.
 */
export async function wrappedTrustApprove(config: WriteConfig, inputs: WrappedTrustApproveInputs) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: WrappedTrustAbi,
		functionName: 'approve',
		args,
	});

	return await walletClient.writeContract(request);
}

import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type MultiVaultApproveInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'nonpayable', 'approve'>;
};

/**
 * Simulates and submits a MultiVault `approve` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for approval updates.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultApprove(config: WriteConfig, inputs: MultiVaultApproveInputs) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultAbi,
		functionName: 'approve',
		args,
	});

	return await walletClient.writeContract(request);
}

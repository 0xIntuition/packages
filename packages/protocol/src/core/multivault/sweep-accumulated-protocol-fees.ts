import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type MultiVaultSweepAccumulatedProtocolFeesInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'nonpayable', 'sweepAccumulatedProtocolFees'>;
};

/**
 * Simulates and submits `sweepAccumulatedProtocolFees`.
 * @param config Contract address and viem clients.
 * @param inputs Function args for epoch fee sweep.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultSweepAccumulatedProtocolFees(
	config: WriteConfig,
	inputs: MultiVaultSweepAccumulatedProtocolFeesInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultAbi,
		functionName: 'sweepAccumulatedProtocolFees',
		args,
	});

	return await walletClient.writeContract(request);
}

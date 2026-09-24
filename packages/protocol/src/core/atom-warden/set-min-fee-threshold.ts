import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenSetMinFeeThresholdInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setMinFeeThreshold'>;
};

/**
 * Simulates and submits an AtomWarden `setMinFeeThreshold` transaction. Admin-only.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new minimum fee threshold.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetMinFeeThreshold(
	config: WriteConfig,
	inputs: AtomWardenSetMinFeeThresholdInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setMinFeeThreshold',
		args,
	});

	return await walletClient.writeContract(request);
}

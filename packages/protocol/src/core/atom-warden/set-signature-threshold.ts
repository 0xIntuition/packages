import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenSetSignatureThresholdInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setSignatureThreshold'>;
};

/**
 * Simulates and submits an AtomWarden `setSignatureThreshold` transaction. Admin-only.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new signature threshold.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetSignatureThreshold(
	config: WriteConfig,
	inputs: AtomWardenSetSignatureThresholdInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setSignatureThreshold',
		args,
	});

	return await walletClient.writeContract(request);
}

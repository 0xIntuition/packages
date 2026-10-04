import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenSetMaxValidUntilInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setMaxValidUntil'>;
};

/**
 * Simulates and submits an AtomWarden `setMaxValidUntil` transaction. Admin-only. `0`
 * makes every signed claim instantly expired; `type(uint48).max` disables the cap.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new max valid-until cap.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetMaxValidUntil(
	config: WriteConfig,
	inputs: AtomWardenSetMaxValidUntilInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setMaxValidUntil',
		args,
	});

	return await walletClient.writeContract(request);
}

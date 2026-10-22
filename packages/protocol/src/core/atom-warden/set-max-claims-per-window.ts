import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenSetMaxClaimsPerWindowInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setMaxClaimsPerWindow'>;
};

/**
 * Simulates and submits an AtomWarden `setMaxClaimsPerWindow` transaction. Admin-only.
 * `0` disables the cap entirely.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new per-window claim cap.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetMaxClaimsPerWindow(
	config: WriteConfig,
	inputs: AtomWardenSetMaxClaimsPerWindowInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setMaxClaimsPerWindow',
		args,
	});

	return await walletClient.writeContract(request);
}

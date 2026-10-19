import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenSetMultiVaultInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setMultiVault'>;
};

/**
 * Simulates and submits an AtomWarden `setMultiVault` transaction. Admin-only.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new MultiVault address.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetMultiVault(
	config: WriteConfig,
	inputs: AtomWardenSetMultiVaultInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setMultiVault',
		args,
	});

	return await walletClient.writeContract(request);
}

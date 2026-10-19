import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenGrantAtomWalletOwnershipInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'grantAtomWalletOwnership'>;
};

/**
 * Simulates and submits an AtomWarden `grantAtomWalletOwnership` transaction. Restricted
 * to the operator role.
 * @param config Contract address and viem clients.
 * @param inputs Function args: the atom ID and the new owner.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenGrantAtomWalletOwnership(
	config: WriteConfig,
	inputs: AtomWardenGrantAtomWalletOwnershipInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'grantAtomWalletOwnership',
		args,
	});

	return await walletClient.writeContract(request);
}

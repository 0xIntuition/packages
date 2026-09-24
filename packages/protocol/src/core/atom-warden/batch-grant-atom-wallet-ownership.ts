import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenBatchGrantAtomWalletOwnershipInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'batchGrantAtomWalletOwnership'>;
};

/**
 * Simulates and submits an AtomWarden `batchGrantAtomWalletOwnership` transaction.
 * Restricted to the operator role; bounded by `MAX_BATCH_SIZE`.
 * @param config Contract address and viem clients.
 * @param inputs Function args: the atom IDs and their new owners, aligned by index.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenBatchGrantAtomWalletOwnership(
	config: WriteConfig,
	inputs: AtomWardenBatchGrantAtomWalletOwnershipInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'batchGrantAtomWalletOwnership',
		args,
	});

	return await walletClient.writeContract(request);
}

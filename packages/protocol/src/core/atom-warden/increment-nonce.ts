import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenIncrementNonceInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'incrementNonce'>;
};

/**
 * Simulates and submits an AtomWarden `incrementNonce` transaction — invalidates the
 * claimant's current EIP-712 claim nonce.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the claimant whose nonce is incremented.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenIncrementNonce(
	config: WriteConfig,
	inputs: AtomWardenIncrementNonceInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'incrementNonce',
		args,
	});

	return await walletClient.writeContract(request);
}

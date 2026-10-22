import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenClaimAsCreatorAfterExpiryInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'claimAsCreatorAfterExpiry'>;
};

/**
 * Simulates and submits an AtomWarden `claimAsCreatorAfterExpiry` transaction — the
 * creator-fallback claim path, available once `claimWindow` has elapsed since atom
 * creation.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the atom claim.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenClaimAsCreatorAfterExpiry(
	config: WriteConfig,
	inputs: AtomWardenClaimAsCreatorAfterExpiryInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'claimAsCreatorAfterExpiry',
		args,
	});

	return await walletClient.writeContract(request);
}

import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenClaimOwnershipOverAddressAtomInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'claimOwnershipOverAddressAtom'>;
};

/**
 * Simulates and submits an AtomWarden `claimOwnershipOverAddressAtom` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the atom claim.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenClaimOwnershipOverAddressAtom(
	config: WriteConfig,
	inputs: AtomWardenClaimOwnershipOverAddressAtomInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'claimOwnershipOverAddressAtom',
		args,
	});

	return await walletClient.writeContract(request);
}

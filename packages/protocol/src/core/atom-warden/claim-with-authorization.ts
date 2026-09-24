import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenClaimWithAuthorizationInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'claimWithAuthorization'>;
};

/**
 * Simulates and submits an AtomWarden `claimWithAuthorization` transaction — a
 * signature-authorized atom-wallet ownership claim.
 * @param config Contract address and viem clients.
 * @param inputs Function args: the `ClaimAuthorization` payload and the quorum signature bundle.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenClaimWithAuthorization(
	config: WriteConfig,
	inputs: AtomWardenClaimWithAuthorizationInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'claimWithAuthorization',
		args,
	});

	return await walletClient.writeContract(request);
}

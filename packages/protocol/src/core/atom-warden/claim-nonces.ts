import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a claimant's current EIP-712 claim nonce.
 * @param config Contract address and public client.
 * @param inputs Function args for the claimant lookup.
 * @returns The claimant's current nonce.
 */
export async function atomWardenClaimNonces(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof AtomWardenAbi, 'view' | 'pure', 'claimNonces'>;
	}
): Promise<AtomWardenClaimNoncesResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'claimNonces',
		args,
	});
}

export type AtomWardenClaimNoncesResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'claimNonces'
>;

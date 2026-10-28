import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the last active epoch for a user from the MultiVault contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the user lookup.
 * @returns Last active epoch as returned by the contract.
 */
export async function multiVaultGetUserLastActiveEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getUserLastActiveEpoch'>;
	}
): Promise<MultiVaultGetUserLastActiveEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getUserLastActiveEpoch',
		args,
	});
}

export type MultiVaultGetUserLastActiveEpochResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getUserLastActiveEpoch'
>;

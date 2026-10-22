import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a vault struct from the MultiVault `getVault` view function.
 * @param config Contract address and public client.
 * @param inputs Function args for the vault lookup.
 * @returns Contract response for the vault.
 */
export async function multiVaultGetVault(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getVault'>;
	}
): Promise<MultiVaultGetVaultResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getVault',
		args,
	});
}

export type MultiVaultGetVaultResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getVault'
>;

import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a triple struct from the MultiVault `getTriple` view function.
 * @param config Contract address and public client.
 * @param inputs Function args for the triple lookup.
 * @returns Contract response for the triple.
 */
export async function multiVaultGetTriple(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getTriple'>;
	}
): Promise<MultiVaultGetTripleResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getTriple',
		args,
	});
}

export type MultiVaultGetTripleResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getTriple'
>;

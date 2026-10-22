import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads atom data from the MultiVault `atom` view function.
 * @param config Contract address and public client.
 * @param inputs Function args for the atom lookup.
 * @returns Contract response for the atom.
 */
export async function multiVaultAtom(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'atom'>;
	}
): Promise<MultiVaultAtomResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'atom',
		args,
	});
}

export type MultiVaultAtomResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'atom'
>;

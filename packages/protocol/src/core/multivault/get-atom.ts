import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads an atom struct from the MultiVault `getAtom` view function.
 * @param config Contract address and public client.
 * @param inputs Function args for the atom lookup.
 * @returns Contract response for the atom.
 */
export async function multiVaultGetAtom(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getAtom'>;
	}
): Promise<MultiVaultGetAtomResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtom',
		args,
	});
}

export type MultiVaultGetAtomResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getAtom'
>;

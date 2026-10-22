import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the atom configuration from the MultiVault contract.
 * @param config Contract address and public client.
 * @returns Atom configuration struct from the contract.
 */
export async function multiVaultGetAtomConfig(
	config: ReadConfig
): Promise<MultiVaultGetAtomConfigResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtomConfig',
	});
}

export type MultiVaultGetAtomConfigResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getAtomConfig'
>;

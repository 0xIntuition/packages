import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the triple configuration from the MultiVault contract.
 * @param config Contract address and public client.
 * @returns Triple configuration struct from the contract.
 */
export async function multiVaultGetTripleConfig(
	config: ReadConfig
): Promise<MultiVaultGetTripleConfigResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getTripleConfig',
	});
}

export type MultiVaultGetTripleConfigResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getTripleConfig'
>;

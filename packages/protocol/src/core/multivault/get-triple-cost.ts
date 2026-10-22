import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the base triple cost from the MultiVault contract.
 * @param config Contract address and public client.
 * @returns Base triple creation cost as returned by the contract.
 */
export async function multiVaultGetTripleCost(
	config: ReadConfig
): Promise<MultiVaultGetTripleCostResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getTripleCost',
	});
}

export type MultiVaultGetTripleCostResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getTripleCost'
>;

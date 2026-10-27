import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the base atom cost from the MultiVault contract.
 * @param config Contract address and public client.
 * @returns Base atom creation cost as returned by the contract.
 */
export async function multiVaultGetAtomCost(
	config: ReadConfig
): Promise<MultiVaultGetAtomCostResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtomCost',
	});
}

export type MultiVaultGetAtomCostResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getAtomCost'
>;

import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the current epoch from the MultiVault contract.
 * @param config Contract address and public client.
 * @returns Current epoch as returned by the contract.
 */
export async function multiVaultCurrentEpoch(
	config: ReadConfig
): Promise<MultiVaultCurrentEpochResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'currentEpoch',
	});
}

export type MultiVaultCurrentEpochResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'currentEpoch'
>;

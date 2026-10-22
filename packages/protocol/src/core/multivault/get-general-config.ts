import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the general configuration from the MultiVault contract.
 * @param config Contract address and public client.
 * @returns General configuration struct from the contract.
 */
export async function multiVaultGetGeneralConfig(
	config: ReadConfig
): Promise<MultiVaultGetGeneralConfigResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getGeneralConfig',
	});
}

export type MultiVaultGetGeneralConfigResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getGeneralConfig'
>;

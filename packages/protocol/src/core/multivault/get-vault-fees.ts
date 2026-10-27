import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads vault fees from MultiVault `getVaultFees`.
 * @param config Contract address and public client.
 * @returns Vault fees struct.
 */
export async function multiVaultGetVaultFees(
	config: ReadConfig
): Promise<MultiVaultGetVaultFeesResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getVaultFees',
	});
}

export type MultiVaultGetVaultFeesResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getVaultFees'
>;

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads vault fees from MultiVault `getVaultFees`.
 * @param config Contract address and public client.
 * @returns Vault fees struct.
 */
export async function multiVaultGetVaultFees(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getVaultFees',
	});
}

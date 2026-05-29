import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads atom warden address from MultiVault `getAtomWarden`.
 * @param config Contract address and public client.
 * @returns Atom warden address.
 */
export async function multiVaultGetAtomWarden(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtomWarden',
	});
}

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads MultiVault's atom URI bounds — the maximum number of context URIs allowed per
 * atom and the maximum byte length allowed per URI. `createAtomsWithUris` reverts if
 * either bound is exceeded.
 * @param config Contract address and public client.
 * @returns `[maxUriCount, maxUriLength]`.
 */
export async function multiVaultGetAtomUriConfig(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtomUriConfig',
	});
}

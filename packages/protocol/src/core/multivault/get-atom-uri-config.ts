import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the effective URI count and byte-length limits for atom creation. */
export async function multiVaultGetAtomUriConfig(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtomUriConfig',
	});
}

import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the `SIGNER_ROLE` access-control role identifier. */
export async function atomWardenSignerRole(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'SIGNER_ROLE',
	});
}

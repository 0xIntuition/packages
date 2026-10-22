import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the maximum number of authorized claims allowed per `claimCapWindow`-length window. */
export async function atomWardenMaxClaimsPerWindow(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'maxClaimsPerWindow',
	});
}

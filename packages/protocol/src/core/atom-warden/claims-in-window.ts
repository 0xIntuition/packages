import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the count of authorized claims made in the current claim-cap window. */
export async function atomWardenClaimsInWindow(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'claimsInWindow',
	});
}

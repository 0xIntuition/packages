import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the length (seconds) of the fixed window used by the authorized-claim cap. */
export async function atomWardenClaimCapWindow(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'claimCapWindow',
	});
}

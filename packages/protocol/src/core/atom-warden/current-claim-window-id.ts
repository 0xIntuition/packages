import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the current authorized-claim cap window id. */
export async function atomWardenCurrentClaimWindowId(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'currentClaimWindowId',
	});
}

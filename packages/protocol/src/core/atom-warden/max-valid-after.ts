import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the maximum allowed `validAfter - block.timestamp` for a `ClaimAuthorization`. */
export async function atomWardenMaxValidAfter(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'maxValidAfter',
	});
}

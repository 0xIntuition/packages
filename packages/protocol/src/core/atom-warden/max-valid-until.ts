import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the maximum allowed `validUntil - block.timestamp` for a `ClaimAuthorization`. */
export async function atomWardenMaxValidUntil(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'maxValidUntil',
	});
}

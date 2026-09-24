import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the minimum atom-wallet fee threshold required before a creator-fallback claim. */
export async function atomWardenMinFeeThreshold(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'minFeeThreshold',
	});
}

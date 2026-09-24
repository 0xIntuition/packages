import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the minimum number of distinct SIGNER_ROLE signatures required per authorized claim. */
export async function atomWardenSignatureThreshold(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'signatureThreshold',
	});
}

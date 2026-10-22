import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the current count of addresses holding `SIGNER_ROLE`. */
export async function atomWardenSignerCount(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'signerCount',
	});
}

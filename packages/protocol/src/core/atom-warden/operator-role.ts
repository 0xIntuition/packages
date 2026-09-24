import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the `OPERATOR_ROLE` access-control role identifier. */
export async function atomWardenOperatorRole(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'OPERATOR_ROLE',
	});
}

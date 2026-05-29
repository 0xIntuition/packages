import { WrappedTrustAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads current WrappedTrust total supply.
 * @param config Contract address and public client.
 * @returns WrappedTrust total supply.
 */
export async function wrappedTrustTotalSupply(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: WrappedTrustAbi,
		functionName: 'totalSupply',
	});
}

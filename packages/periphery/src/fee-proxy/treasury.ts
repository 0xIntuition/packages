import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the treasury that receives affiliate registration fees.
 * @param config Contract address and public client.
 * @returns The treasury address.
 */
export async function feeProxyTreasury(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'treasury',
	});
}

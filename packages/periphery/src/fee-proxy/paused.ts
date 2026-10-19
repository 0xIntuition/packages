import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the global pause flag. While set, every routing entry point and registration
 * reverts; refund claims and affiliate self-service updates stay open.
 * @param config Contract address and public client.
 * @returns Whether FeeProxy is globally paused.
 */
export async function feeProxyPaused(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'paused',
	});
}

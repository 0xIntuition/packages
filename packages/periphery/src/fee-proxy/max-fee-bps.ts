import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the protocol-level cap on every affiliate bps field. Enforced at registration, on
 * fee updates and again at routing time for the side being used. Not the same as the
 * caller's per-call `FeeGuard.maxFeeBps`.
 * @param config Contract address and public client.
 * @returns The bps cap.
 */
export async function feeProxyMaxFeeBps(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'maxFeeBps',
	});
}

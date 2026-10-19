import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the protocol-level cap on every affiliate fixed fee (TRUST wei). Enforced like
 * `maxFeeBps`. Not the same as the caller's per-call `FeeGuard.maxFixedFee`.
 * @param config Contract address and public client.
 * @returns The fixed-fee cap.
 */
export async function feeProxyMaxFixedFee(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'maxFixedFee',
	});
}

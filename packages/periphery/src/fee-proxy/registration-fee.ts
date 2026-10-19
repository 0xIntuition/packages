import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the fee `registerAffiliate` must be called with, exactly, as `msg.value`.
 * @param config Contract address and public client.
 * @returns The registration fee (TRUST wei).
 */
export async function feeProxyRegistrationFee(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'registrationFee',
	});
}

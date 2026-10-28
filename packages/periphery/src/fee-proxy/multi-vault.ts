import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the MultiVault that FeeProxy forwards every deposit and create to, and on which it checks
 * the caller's and receiver's approvals. It is set once at initialization; there is no setter.
 * @param config Contract address and public client.
 * @returns The MultiVault address.
 */
export async function feeProxyMultiVault(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'multiVault',
	});
}

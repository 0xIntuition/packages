import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the routing counters for one user under one affiliate.
 * @param config Contract address and public client.
 * @param inputs Function args: the affiliate and the user.
 * @returns The stored `AffiliateUserStats`.
 */
export async function feeProxyAffiliateUserStats(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'affiliateUserStats'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'affiliateUserStats',
		args,
	});
}

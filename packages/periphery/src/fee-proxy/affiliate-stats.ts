import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads an affiliate's aggregate routing counters: transactions, unique users, and gross,
 * fee and forwarded totals, overall and split by deposit and creation. A batch call counts
 * as one transaction.
 * @param config Contract address and public client.
 * @param inputs Function args for the affiliate lookup.
 * @returns The stored `AffiliateStats`.
 */
export async function feeProxyAffiliateStats(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'affiliateStats'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'affiliateStats',
		args,
	});
}

import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the full affiliate registry row. For an unregistered affiliate, returns a
 * zero-valued struct.
 * @param config Contract address and public client.
 * @param inputs Function args for the affiliate lookup.
 * @returns The stored `AffiliateConfig`.
 */
export async function feeProxyAffiliateConfig(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'affiliateConfig'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'affiliateConfig',
		args,
	});
}

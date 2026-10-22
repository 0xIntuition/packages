import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads whether an affiliate is registered and not paused — the condition every FeeProxy
 * routing entry point checks.
 * @param config Contract address and public client.
 * @param inputs Function args for the affiliate lookup.
 * @returns Whether the affiliate is active.
 */
export async function feeProxyIsAffiliateActive(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'isAffiliateActive'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'isAffiliateActive',
		args,
	});
}

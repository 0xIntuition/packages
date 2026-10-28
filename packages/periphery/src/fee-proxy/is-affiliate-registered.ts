import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads whether an affiliate has a registry row, paused or not.
 * @param config Contract address and public client.
 * @param inputs Function args for the affiliate lookup.
 * @returns Whether the affiliate is registered.
 */
export async function feeProxyIsAffiliateRegistered(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'isAffiliateRegistered'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'isAffiliateRegistered',
		args,
	});
}

import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads every lot an account holds in a vault, highest tier first, which is the order a redeem
 * unwinds them.
 * @param config Contract address and public client.
 * @param inputs Function args for the term/account lookup.
 * @returns `[tiers, stakes]` — each lot's tier and the stake it holds.
 */
export async function dynamicFeeFlatPriceCurveUserLots(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'userLots'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'userLots',
		args,
	});
}

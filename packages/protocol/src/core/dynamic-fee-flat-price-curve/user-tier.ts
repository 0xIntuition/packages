import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads a user's tracked bucket (`round(avgEntryTier)`) in a vault on the dynamic-fee
 * curve — the tier a withdrawal-fee quote for this user should key on.
 * @param config Contract address and public client.
 * @param inputs Function args for the term/user lookup.
 * @returns The user's tracked tier.
 */
export async function dynamicFeeFlatPriceCurveUserTier(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'userTier'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'userTier',
		args,
	});
}

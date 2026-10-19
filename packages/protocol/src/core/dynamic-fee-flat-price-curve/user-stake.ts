import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads a user's tracked stake in a vault on the dynamic-fee curve.
 * @param config Contract address and public client.
 * @param inputs Function args for the term/user lookup.
 * @returns The user's tracked stake.
 */
export async function dynamicFeeFlatPriceCurveUserStake(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'userStake'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'userStake',
		args,
	});
}

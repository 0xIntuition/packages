import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads an account's SETTLED earnings — the term-independent balance that `claimable` folds into
 * every per-term answer. Reading it separately is what lets a consumer show a claim balance split
 * into settled and pending without double-counting the settled half.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The account's settled balance.
 */
export async function dynamicFeeFlatPriceCurveBankedEarnings(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof DynamicFeeFlatPriceCurveAbi,
			'view' | 'pure',
			'bankedEarnings'
		>;
	}
): Promise<DynamicFeeFlatPriceCurveBankedEarningsResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'bankedEarnings',
		args,
	});
}

export type DynamicFeeFlatPriceCurveBankedEarningsResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'bankedEarnings'
>;

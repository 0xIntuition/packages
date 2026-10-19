import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads a lot's settled reward debt — the accumulator checkpoint the lot's pending earnings are
 * measured from, equal to `lotStake * accFeePerShare[tier] / ACC_PRECISION` as of the last settle.
 * @param config Contract address and public client.
 * @param inputs Function args for the term/account/tier lookup.
 * @returns The lot's reward debt.
 */
export async function dynamicFeeFlatPriceCurveLotRewardDebt(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'lotRewardDebt'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'lotRewardDebt',
		args,
	});
}

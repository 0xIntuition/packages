import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a tier's accumulator, in `ACC_PRECISION` units. Together with `lotStake` and
 * `lotRewardDebt` it is the raw material behind `pendingFor`, for consumers reconciling an earnings
 * figure rather than displaying it.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The tier's accumulated fee per share.
 */
export async function dynamicFeeFlatPriceCurveAccFeePerShare(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof DynamicFeeFlatPriceCurveAbi,
			'view' | 'pure',
			'accFeePerShare'
		>;
	}
): Promise<DynamicFeeFlatPriceCurveAccFeePerShareResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'accFeePerShare',
		args,
	});
}

export type DynamicFeeFlatPriceCurveAccFeePerShareResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'accFeePerShare'
>;

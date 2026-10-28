import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a tier's sparse manual fee override, if one is set.
 * @param config Contract address and public client.
 * @param inputs Function args for the tier lookup.
 * @returns `[isSet, depositFeeBps, redeemFeeBps]` for the tier.
 */
export async function dynamicFeeFlatPriceCurveTierFeeOverride(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof DynamicFeeFlatPriceCurveAbi,
			'view' | 'pure',
			'tierFeeOverride'
		>;
	}
): Promise<DynamicFeeFlatPriceCurveTierFeeOverrideResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'tierFeeOverride',
		args,
	});
}

export type DynamicFeeFlatPriceCurveTierFeeOverrideResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'tierFeeOverride'
>;

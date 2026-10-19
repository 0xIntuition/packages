import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads a tier's sparse manual fee override, if one is set.
 * @param config Contract address and public client.
 * @param inputs Function args for the tier lookup.
 * @returns `[isSet, depositFeeBps, withdrawalFeeBps]` for the tier.
 */
export async function dynamicFeeFlatPriceCurveTierFeeOverride(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'tierFeeOverride'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'tierFeeOverride',
		args,
	});
}

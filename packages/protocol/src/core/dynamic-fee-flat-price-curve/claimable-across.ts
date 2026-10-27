import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the total withdrawable amount across the supplied terms for an account — the
 * figure `claim` would pay. `termIds` must be unique; an empty set returns the banked
 * balance alone.
 * @param config Contract address and public client.
 * @param inputs Function args for the account and the set of terms to include.
 * @returns The total claimable amount across the supplied terms.
 */
export async function dynamicFeeFlatPriceCurveClaimableAcross(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof DynamicFeeFlatPriceCurveAbi,
			'view' | 'pure',
			'claimableAcross'
		>;
	}
): Promise<DynamicFeeFlatPriceCurveClaimableAcrossResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'claimableAcross',
		args,
	});
}

export type DynamicFeeFlatPriceCurveClaimableAcrossResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'claimableAcross'
>;

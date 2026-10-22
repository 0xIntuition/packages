import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the deposit rate charged while a vault sits in a tier, override included. The on-chain
 * counterpart of `dynamicFeeDepositFeeBps`.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The tier's deposit rate in basis points.
 */
export async function dynamicFeeFlatPriceCurveDepositFeeBps(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof DynamicFeeFlatPriceCurveAbi,
			'view' | 'pure',
			'depositFeeBps'
		>;
	}
): Promise<DynamicFeeFlatPriceCurveDepositFeeBpsResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'depositFeeBps',
		args,
	});
}

export type DynamicFeeFlatPriceCurveDepositFeeBpsResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'depositFeeBps'
>;

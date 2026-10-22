import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the withdrawal rate charged to a holder exiting from a tier, override included. The
 * on-chain counterpart of `dynamicFeeRedeemFeeBps`.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The tier's withdrawal rate in basis points.
 */
export async function dynamicFeeFlatPriceCurveRedeemFeeBps(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view' | 'pure', 'redeemFeeBps'>;
	}
): Promise<DynamicFeeFlatPriceCurveRedeemFeeBpsResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'redeemFeeBps',
		args,
	});
}

export type DynamicFeeFlatPriceCurveRedeemFeeBpsResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'redeemFeeBps'
>;

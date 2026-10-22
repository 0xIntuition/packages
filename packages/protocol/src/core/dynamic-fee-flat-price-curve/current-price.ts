import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the price of one share (1e18 units) in assets for a vault at `totalShares`/`totalAssets`.
 * Inherited unchanged from `LinearCurve`, so the result is a pure function of the inputs.
 * @param config Contract address and public client.
 * @param inputs Function args: `[totalShares, totalAssets]` of the vault being priced.
 * @returns The assets one whole share is worth at that vault state.
 */
export async function dynamicFeeFlatPriceCurveCurrentPrice(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'pure', 'currentPrice'>;
	}
): Promise<DynamicFeeFlatPriceCurveCurrentPriceResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'currentPrice',
		args,
	});
}

export type DynamicFeeFlatPriceCurveCurrentPriceResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'currentPrice'
>;

import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Previews the assets the curve charges to mint `shares` against a vault at
 * `totalShares`/`totalAssets`, before any MultiVault or curve-hook fees.
 * Inherited unchanged from `LinearCurve`, so the result is a pure function of the inputs.
 * @param config Contract address and public client.
 * @param inputs Function args: `[shares, totalShares, totalAssets]`.
 * @returns The assets required to mint those shares.
 */
export async function dynamicFeeFlatPriceCurvePreviewMint(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'pure', 'previewMint'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'previewMint',
		args,
	});
}

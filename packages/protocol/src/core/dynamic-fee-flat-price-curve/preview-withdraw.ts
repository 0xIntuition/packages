import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Previews the shares the curve burns to withdraw `assets` from a vault at
 * `totalAssets`/`totalShares`, before any MultiVault or curve-hook fees.
 * Inherited unchanged from `LinearCurve`, so the result is a pure function of the inputs.
 * @param config Contract address and public client.
 * @param inputs Function args: `[assets, totalAssets, totalShares]`.
 * @returns The shares burned for those assets.
 */
export async function dynamicFeeFlatPriceCurvePreviewWithdraw(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'pure', 'previewWithdraw'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'previewWithdraw',
		args,
	});
}

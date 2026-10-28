import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { IBaseCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Previews the shares the curve burns to withdraw `assets` from a vault at
 * `totalAssets`/`totalShares`, before any MultiVault or curve-hook fees.
 * Works on any registered curve through the shared `IBaseCurve` interface.
 * @param config Curve address and public client.
 * @param inputs Function args: `[assets, totalAssets, totalShares]`.
 * @returns The shares burned for those assets.
 */
export async function baseCurvePreviewWithdraw(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof IBaseCurveAbi, 'view' | 'pure', 'previewWithdraw'>;
	}
): Promise<BaseCurvePreviewWithdrawResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'previewWithdraw',
		args,
	});
}

export type BaseCurvePreviewWithdrawResult = ContractFunctionReturnType<
	typeof IBaseCurveAbi,
	'view' | 'pure',
	'previewWithdraw'
>;

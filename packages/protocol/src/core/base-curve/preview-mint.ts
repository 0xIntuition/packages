import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { IBaseCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Previews the assets the curve charges to mint `shares` against a vault at
 * `totalShares`/`totalAssets`, before any MultiVault or curve-hook fees.
 * Works on any registered curve through the shared `IBaseCurve` interface.
 * @param config Curve address and public client.
 * @param inputs Function args: `[shares, totalShares, totalAssets]`.
 * @returns The assets required to mint those shares.
 */
export async function baseCurvePreviewMint(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof IBaseCurveAbi, 'view' | 'pure', 'previewMint'>;
	}
): Promise<BaseCurvePreviewMintResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'previewMint',
		args,
	});
}

export type BaseCurvePreviewMintResult = ContractFunctionReturnType<
	typeof IBaseCurveAbi,
	'view' | 'pure',
	'previewMint'
>;

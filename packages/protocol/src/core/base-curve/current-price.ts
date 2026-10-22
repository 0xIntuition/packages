import type { ContractFunctionArgs } from 'viem';

import { IBaseCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the price of one share (1e18 units) in assets for a vault at `totalShares`/`totalAssets`.
 * Works on any registered curve through the shared `IBaseCurve` interface.
 * @param config Curve address and public client.
 * @param inputs Function args: `[totalShares, totalAssets]` of the vault being priced.
 * @returns The assets one whole share is worth at that vault state.
 */
export async function baseCurveCurrentPrice(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof IBaseCurveAbi, 'view', 'currentPrice'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'currentPrice',
		args,
	});
}

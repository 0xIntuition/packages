import type { ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the DynamicFeeFlatPriceCurve tier + fee schedule.
 *
 * The return type follows the canonical ABI without depending on curve math.
 * @param config Contract address and public client.
 * @returns The curve's current `DynamicFeeConfig`.
 */
export async function dynamicFeeFlatPriceCurveGetConfig(
	config: ReadConfig
): Promise<DynamicFeeFlatPriceCurveGetConfigResult> {
	const { address, publicClient } = config;

	const raw = await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'getConfig',
	});

	return raw;
}

export type DynamicFeeFlatPriceCurveGetConfigResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view',
	'getConfig'
>;

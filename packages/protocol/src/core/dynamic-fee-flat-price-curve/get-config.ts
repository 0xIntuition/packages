import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the DynamicFeeFlatPriceCurve tier + fee schedule.
 * @param config Contract address and public client.
 * @returns The curve's current `DynamicFeeConfig`.
 */
export async function dynamicFeeFlatPriceCurveGetConfig(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'getConfig',
	});
}

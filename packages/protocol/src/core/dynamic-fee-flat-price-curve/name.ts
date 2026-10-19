import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the curve's own registered name. Pairs with the registry's `getCurveName` to confirm that
 * a resolved address is the curve a caller intended.
 * @param config Contract address and public client.
 * @returns The curve's name.
 */
export async function dynamicFeeFlatPriceCurveName(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'name',
	});
}

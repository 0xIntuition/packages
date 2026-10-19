import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the largest vault asset total the curve can handle without overflowing. MultiVault
 * checks it before transacting.
 * Inherited unchanged from `LinearCurve`, so the result is a pure function of the inputs.
 * @param config Contract address and public client.
 * @returns The curve's asset ceiling.
 */
export async function dynamicFeeFlatPriceCurveMaxAssets(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'maxAssets',
	});
}

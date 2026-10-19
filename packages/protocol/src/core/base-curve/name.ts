import { IBaseCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads a curve's own name, whichever concrete curve it is. Pairs with the registry's
 * `getCurveName` to confirm that a resolved address is the curve a caller intended.
 * @param config Curve address and public client.
 * @returns The curve's name.
 */
export async function baseCurveName(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'name',
	});
}

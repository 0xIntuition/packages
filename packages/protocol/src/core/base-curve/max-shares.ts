import { IBaseCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the largest vault share total the curve can handle without overflowing. MultiVault
 * checks it before transacting.
 * Works on any registered curve through the shared `IBaseCurve` interface.
 * @param config Curve address and public client.
 * @returns The curve's share ceiling.
 */
export async function baseCurveMaxShares(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'maxShares',
	});
}

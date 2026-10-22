import type { DynamicFeeConfig } from '@0xintuition/curves';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the DynamicFeeFlatPriceCurve tier + fee schedule.
 *
 * The return type is pinned to `DynamicFeeConfig` from `@0xintuition/curves` rather than left as
 * viem's inferred struct decode. The two are structurally the same, but the inferred type does not
 * satisfy the declared one, so every consumer that read the config here and fed it to the tier maths
 * there had to bridge the gap with a double cast — including this package's own SDK, in two places.
 * Asserting once, here, is what makes the two packages compose.
 * @param config Contract address and public client.
 * @returns The curve's current `DynamicFeeConfig`.
 */
export async function dynamicFeeFlatPriceCurveGetConfig(
	config: ReadConfig
): Promise<DynamicFeeConfig> {
	const { address, publicClient } = config;

	const raw = await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'getConfig',
	});

	return raw as unknown as DynamicFeeConfig;
}

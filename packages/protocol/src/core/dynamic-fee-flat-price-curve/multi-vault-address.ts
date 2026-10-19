import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the MultiVault address authorized to call this curve's record hooks.
 * @param config Contract address and public client.
 * @returns The authorized MultiVault address.
 */
export async function dynamicFeeFlatPriceCurveMultiVaultAddress(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'multiVault',
	});
}

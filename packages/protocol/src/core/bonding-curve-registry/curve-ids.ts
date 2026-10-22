import type { ContractFunctionArgs } from 'viem';

import { BondingCurveRegistryAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Resolves a curve's registry id from its deployed address — the inverse of `curveAddresses`.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The curve's registry id, or 0 if the address is not registered.
 */
export async function bondingCurveRegistryCurveIds(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof BondingCurveRegistryAbi, 'view', 'curveIds'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: BondingCurveRegistryAbi,
		functionName: 'curveIds',
		args,
	});
}

import type { ContractFunctionReturnType } from 'viem';
import { BondingCurveRegistryAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads how many bonding curves the registry has registered. Curve ids run `1..count`, so this
 * is what bounds any walk over `curveAddresses`.
 * @param config Contract address and public client.
 * @returns The number of registered curves.
 */
export async function bondingCurveRegistryCount(
	config: ReadConfig
): Promise<BondingCurveRegistryCountResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: BondingCurveRegistryAbi,
		functionName: 'count',
	});
}

export type BondingCurveRegistryCountResult = ContractFunctionReturnType<
	typeof BondingCurveRegistryAbi,
	'view' | 'pure',
	'count'
>;

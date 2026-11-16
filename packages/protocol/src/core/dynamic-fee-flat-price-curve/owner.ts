import type { ContractFunctionReturnType } from 'viem';
import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the account that owns the curve and can change its configuration.
 * @param config Contract address and public client.
 * @returns The owner address.
 */
export async function dynamicFeeFlatPriceCurveOwner(
	config: ReadConfig
): Promise<DynamicFeeFlatPriceCurveOwnerResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'owner',
	});
}

export type DynamicFeeFlatPriceCurveOwnerResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'owner'
>;

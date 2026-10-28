import type { ContractFunctionReturnType } from 'viem';
import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the largest vault share total the curve can handle without overflowing. MultiVault
 * checks it before transacting.
 * Inherited unchanged from `LinearCurve`, so the result is a pure function of the inputs.
 * @param config Contract address and public client.
 * @returns The curve's share ceiling.
 */
export async function dynamicFeeFlatPriceCurveMaxShares(
	config: ReadConfig
): Promise<DynamicFeeFlatPriceCurveMaxSharesResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'maxShares',
	});
}

export type DynamicFeeFlatPriceCurveMaxSharesResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'maxShares'
>;

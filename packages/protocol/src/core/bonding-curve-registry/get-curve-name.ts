import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { BondingCurveRegistryAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a registered curve's name. Registry names are globally unique, so this is what confirms
 * that a curve id resolves to the curve a caller meant rather than to whatever now sits at it.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The curve's registered name.
 */
export async function bondingCurveRegistryGetCurveName(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof BondingCurveRegistryAbi, 'view' | 'pure', 'getCurveName'>;
	}
): Promise<BondingCurveRegistryGetCurveNameResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: BondingCurveRegistryAbi,
		functionName: 'getCurveName',
		args,
	});
}

export type BondingCurveRegistryGetCurveNameResult = ContractFunctionReturnType<
	typeof BondingCurveRegistryAbi,
	'view' | 'pure',
	'getCurveName'
>;

import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a tier's asset width from the contract. The on-chain counterpart of
 * `dynamicFeeTierWidthAt`.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The tier's width, in assets.
 */
export async function dynamicFeeFlatPriceCurveTierWidthAt(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view' | 'pure', 'tierWidthAt'>;
	}
): Promise<DynamicFeeFlatPriceCurveTierWidthAtResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'tierWidthAt',
		args,
	});
}

export type DynamicFeeFlatPriceCurveTierWidthAtResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'tierWidthAt'
>;

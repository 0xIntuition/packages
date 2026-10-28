import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a tier's cumulative upper edge from the contract. The on-chain counterpart of
 * `dynamicFeeTierUpperEdge`.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The tier's upper edge, in assets.
 */
export async function dynamicFeeFlatPriceCurveTierUpperEdge(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof DynamicFeeFlatPriceCurveAbi,
			'view' | 'pure',
			'tierUpperEdge'
		>;
	}
): Promise<DynamicFeeFlatPriceCurveTierUpperEdgeResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'tierUpperEdge',
		args,
	});
}

export type DynamicFeeFlatPriceCurveTierUpperEdgeResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'tierUpperEdge'
>;

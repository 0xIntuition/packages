import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the tier a cumulative-asset position falls in, from the contract rather than from the
 * mirrored maths in `@0xintuition/curves`. Having both is what lets a consumer check the off-chain
 * model against the deployment it is pointed at.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The tier index, capped at the top tier.
 */
export async function dynamicFeeFlatPriceCurveTierOf(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view' | 'pure', 'tierOf'>;
	}
): Promise<DynamicFeeFlatPriceCurveTierOfResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'tierOf',
		args,
	});
}

export type DynamicFeeFlatPriceCurveTierOfResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'tierOf'
>;

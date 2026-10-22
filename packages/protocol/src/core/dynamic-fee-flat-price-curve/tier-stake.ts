import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the stake sitting in one tier of a vault — the per-tier occupancy the fee distribution is
 * weighted by, and what turns a rendered tier schedule into a picture of where the money is.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns The tier's current stake.
 */
export async function dynamicFeeFlatPriceCurveTierStake(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'tierStake'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'tierStake',
		args,
	});
}

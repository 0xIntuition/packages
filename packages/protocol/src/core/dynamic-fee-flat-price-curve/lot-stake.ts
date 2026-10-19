import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads a user's lot at one tier of a vault — the stake they hold that entered through that band. A
 * holder has at most one lot per tier; a later deposit landing in the same band tops it up.
 * @param config Contract address and public client.
 * @param inputs Function args for the term/account/tier lookup.
 * @returns The lot's current stake.
 */
export async function dynamicFeeFlatPriceCurveLotStake(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'lotStake'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'lotStake',
		args,
	});
}

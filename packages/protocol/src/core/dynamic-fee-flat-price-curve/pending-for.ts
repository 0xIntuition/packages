import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads unsettled pending earnings for a single term only — additive across terms,
 * unlike `claimable`, which folds in the account's banked (term-independent) balance
 * per call. Summing `claimable` across multiple terms double-counts that banked
 * component; summing `pendingFor` does not.
 * @param config Contract address and public client.
 * @param inputs Function args for the account/term lookup.
 * @returns The term-scoped pending amount, excluding any banked balance.
 */
export async function dynamicFeeFlatPriceCurvePendingFor(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'pendingFor'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'pendingFor',
		args,
	});
}

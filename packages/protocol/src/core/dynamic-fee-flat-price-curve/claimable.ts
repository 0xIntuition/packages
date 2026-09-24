import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the caller-claimable amount for a user in a single vault (booked + unsettled
 * pending).
 * @param config Contract address and public client.
 * @param inputs Function args for the account/term lookup.
 * @returns The claimable amount for the account in the given term.
 */
export async function dynamicFeeFlatPriceCurveClaimable(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'claimable'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'claimable',
		args,
	});
}

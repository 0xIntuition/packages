import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Calculates a counter-triple id from subject, predicate and object ids.
 * @param config Contract address and public client.
 * @param inputs Function args for counter-triple calculation.
 * @returns Calculated counter-triple id.
 */
export async function multiVaultCalculateCounterTripleId(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'pure', 'calculateCounterTripleId'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'calculateCounterTripleId',
		args,
	});
}

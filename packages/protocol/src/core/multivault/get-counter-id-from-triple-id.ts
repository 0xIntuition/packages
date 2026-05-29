import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the counter-triple id for a given triple id.
 * @param config Contract address and public client.
 * @param inputs Function args for triple id.
 * @returns Counter-triple id.
 */
export async function multiVaultGetCounterIdFromTripleId(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'pure', 'getCounterIdFromTripleId'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getCounterIdFromTripleId',
		args,
	});
}

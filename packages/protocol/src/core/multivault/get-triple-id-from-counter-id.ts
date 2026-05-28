import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the primary triple id for a given counter-triple id.
 * @param config Contract address and public client.
 * @param inputs Function args for counter-triple id.
 * @returns Triple id.
 */
export async function multiVaultGetTripleIdFromCounterId(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'getTripleIdFromCounterId'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getTripleIdFromCounterId',
		args,
	});
}

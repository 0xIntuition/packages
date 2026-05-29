import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads accumulated protocol fees for an epoch.
 * @param config Contract address and public client.
 * @param inputs Function args for epoch lookup.
 * @returns Accumulated protocol fees amount.
 */
export async function multiVaultAccumulatedProtocolFees(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'accumulatedProtocolFees'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'accumulatedProtocolFees',
		args,
	});
}

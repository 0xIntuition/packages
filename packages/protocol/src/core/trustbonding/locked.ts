import type { ContractFunctionArgs } from 'viem';

import { TrustBondingAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads lock state from TrustBonding `locked` mapping.
 * @param config Contract address and public client.
 * @param inputs Function args for account lookup.
 * @returns User lock struct.
 */
export async function trustBondingLocked(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view', 'locked'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'locked',
		args,
	});
}

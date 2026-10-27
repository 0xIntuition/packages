import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads lock end timestamp from `locked__end`.
 * @param config Contract address and public client.
 * @param inputs Function args for account lookup.
 * @returns Lock end timestamp.
 */
export async function trustBondingLockedEnd(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'locked__end'>;
	}
): Promise<TrustBondingLockedEndResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'locked__end',
		args,
	});
}

export type TrustBondingLockedEndResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'locked__end'
>;

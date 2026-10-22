import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads user slope from `get_last_user_slope`.
 * @param config Contract address and public client.
 * @param inputs Function args for account lookup.
 * @returns Current user slope.
 */
export async function trustBondingGetLastUserSlope(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'get_last_user_slope'>;
	}
): Promise<TrustBondingGetLastUserSlopeResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'get_last_user_slope',
		args,
	});
}

export type TrustBondingGetLastUserSlopeResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'get_last_user_slope'
>;

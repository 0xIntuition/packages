import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a user's rewards for a given epoch from the TrustBonding contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the rewards query.
 * @returns Rewards data as returned by the contract.
 */
export async function trustBondingGetUserRewardsForEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'getUserRewardsForEpoch'>;
	}
): Promise<TrustBondingGetUserRewardsForEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'getUserRewardsForEpoch',
		args,
	});
}

export type TrustBondingGetUserRewardsForEpochResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'getUserRewardsForEpoch'
>;

import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads unclaimed rewards for an epoch from the TrustBonding contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the rewards query.
 * @returns Unclaimed rewards as returned by the contract.
 */
export async function trustBondingGetUnclaimedRewardsForEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof TrustBondingAbi,
			'view' | 'pure',
			'getUnclaimedRewardsForEpoch'
		>;
	}
): Promise<TrustBondingGetUnclaimedRewardsForEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'getUnclaimedRewardsForEpoch',
		args,
	});
}

export type TrustBondingGetUnclaimedRewardsForEpochResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'getUnclaimedRewardsForEpoch'
>;

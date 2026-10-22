import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Checks whether a user has claimed rewards for a given epoch.
 * @param config Contract address and public client.
 * @param inputs Function args for the claim check.
 * @returns True if rewards have been claimed, as returned by the contract.
 */
export async function trustBondingHasClaimedRewardsForEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof TrustBondingAbi,
			'view' | 'pure',
			'hasClaimedRewardsForEpoch'
		>;
	}
): Promise<TrustBondingHasClaimedRewardsForEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'hasClaimedRewardsForEpoch',
		args,
	});
}

export type TrustBondingHasClaimedRewardsForEpochResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'hasClaimedRewardsForEpoch'
>;

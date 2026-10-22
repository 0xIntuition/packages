import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a user's eligible rewards for an epoch from the TrustBonding contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the rewards query.
 * @returns Eligible rewards as returned by the contract.
 */
export async function trustBondingUserEligibleRewardsForEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof TrustBondingAbi,
			'view' | 'pure',
			'userEligibleRewardsForEpoch'
		>;
	}
): Promise<TrustBondingUserEligibleRewardsForEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'userEligibleRewardsForEpoch',
		args,
	});
}

export type TrustBondingUserEligibleRewardsForEpochResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'userEligibleRewardsForEpoch'
>;

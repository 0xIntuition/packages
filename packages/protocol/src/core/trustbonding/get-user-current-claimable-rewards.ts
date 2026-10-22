import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the user's current claimable rewards from the TrustBonding contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the rewards query.
 * @returns Claimable rewards as returned by the contract.
 */
export async function trustBondingGetUserCurrentClaimableRewards(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof TrustBondingAbi,
			'view' | 'pure',
			'getUserCurrentClaimableRewards'
		>;
	}
): Promise<TrustBondingGetUserCurrentClaimableRewardsResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'getUserCurrentClaimableRewards',
		args,
	});
}

export type TrustBondingGetUserCurrentClaimableRewardsResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'getUserCurrentClaimableRewards'
>;

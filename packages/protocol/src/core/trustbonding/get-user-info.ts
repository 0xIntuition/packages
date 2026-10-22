import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads user info from the TrustBonding contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the user lookup.
 * @returns User info as returned by the contract.
 */
export async function trustBondingGetUserInfo(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'getUserInfo'>;
	}
): Promise<TrustBondingGetUserInfoResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'getUserInfo',
		args,
	});
}

export type TrustBondingGetUserInfoResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'getUserInfo'
>;

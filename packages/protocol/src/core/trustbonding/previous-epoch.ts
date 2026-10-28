import type { ContractFunctionReturnType } from 'viem';
import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the previous epoch from the TrustBonding contract.
 * @param config Contract address and public client.
 * @returns Previous epoch as returned by the contract.
 */
export async function trustBondingPreviousEpoch(
	config: ReadConfig
): Promise<TrustBondingPreviousEpochResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'previousEpoch',
	});
}

export type TrustBondingPreviousEpochResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'previousEpoch'
>;

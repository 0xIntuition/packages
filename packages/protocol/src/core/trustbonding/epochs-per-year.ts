import type { ContractFunctionReturnType } from 'viem';
import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the number of epochs per year from the TrustBonding contract.
 * @param config Contract address and public client.
 * @returns Epochs per year as returned by the contract.
 */
export async function trustBondingEpochsPerYear(
	config: ReadConfig
): Promise<TrustBondingEpochsPerYearResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'epochsPerYear',
	});
}

export type TrustBondingEpochsPerYearResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'epochsPerYear'
>;

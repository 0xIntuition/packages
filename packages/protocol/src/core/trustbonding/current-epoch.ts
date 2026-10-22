import type { ContractFunctionReturnType } from 'viem';
import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the current epoch from the TrustBonding contract.
 * @param config Contract address and public client.
 * @returns Current epoch as returned by the contract.
 */
export async function trustBondingCurrentEpoch(
	config: ReadConfig
): Promise<TrustBondingCurrentEpochResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'currentEpoch',
	});
}

export type TrustBondingCurrentEpochResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'currentEpoch'
>;

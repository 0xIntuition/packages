import type { ContractFunctionReturnType } from 'viem';
import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the total locked amount from the TrustBonding contract.
 * @param config Contract address and public client.
 * @returns Total locked amount as returned by the contract.
 */
export async function trustBondingTotalLocked(
	config: ReadConfig
): Promise<TrustBondingTotalLockedResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'totalLocked',
	});
}

export type TrustBondingTotalLockedResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'totalLocked'
>;

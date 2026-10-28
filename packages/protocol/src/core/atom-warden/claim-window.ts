import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the creator-fallback claim window duration (seconds). */
export async function atomWardenClaimWindow(
	config: ReadConfig
): Promise<AtomWardenClaimWindowResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'claimWindow',
	});
}

export type AtomWardenClaimWindowResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'claimWindow'
>;

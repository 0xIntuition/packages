import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the current authorized-claim cap window id. */
export async function atomWardenCurrentClaimWindowId(
	config: ReadConfig
): Promise<AtomWardenCurrentClaimWindowIdResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'currentClaimWindowId',
	});
}

export type AtomWardenCurrentClaimWindowIdResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'currentClaimWindowId'
>;

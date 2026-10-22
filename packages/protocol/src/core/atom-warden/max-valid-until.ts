import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the maximum allowed `validUntil - block.timestamp` for a `ClaimAuthorization`. */
export async function atomWardenMaxValidUntil(
	config: ReadConfig
): Promise<AtomWardenMaxValidUntilResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'maxValidUntil',
	});
}

export type AtomWardenMaxValidUntilResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'maxValidUntil'
>;

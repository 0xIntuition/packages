import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the maximum allowed `validAfter - block.timestamp` for a `ClaimAuthorization`. */
export async function atomWardenMaxValidAfter(
	config: ReadConfig
): Promise<AtomWardenMaxValidAfterResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'maxValidAfter',
	});
}

export type AtomWardenMaxValidAfterResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'maxValidAfter'
>;

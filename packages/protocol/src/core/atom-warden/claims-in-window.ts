import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the count of authorized claims made in the current claim-cap window. */
export async function atomWardenClaimsInWindow(
	config: ReadConfig
): Promise<AtomWardenClaimsInWindowResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'claimsInWindow',
	});
}

export type AtomWardenClaimsInWindowResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'claimsInWindow'
>;

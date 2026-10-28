import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the maximum number of authorized claims allowed per `claimCapWindow`-length window. */
export async function atomWardenMaxClaimsPerWindow(
	config: ReadConfig
): Promise<AtomWardenMaxClaimsPerWindowResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'maxClaimsPerWindow',
	});
}

export type AtomWardenMaxClaimsPerWindowResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'maxClaimsPerWindow'
>;

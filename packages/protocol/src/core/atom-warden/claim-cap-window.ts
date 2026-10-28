import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the length (seconds) of the fixed window used by the authorized-claim cap. */
export async function atomWardenClaimCapWindow(
	config: ReadConfig
): Promise<AtomWardenClaimCapWindowResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'claimCapWindow',
	});
}

export type AtomWardenClaimCapWindowResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'claimCapWindow'
>;

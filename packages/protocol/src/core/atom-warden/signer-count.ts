import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the current count of addresses holding `SIGNER_ROLE`. */
export async function atomWardenSignerCount(
	config: ReadConfig
): Promise<AtomWardenSignerCountResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'signerCount',
	});
}

export type AtomWardenSignerCountResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'signerCount'
>;

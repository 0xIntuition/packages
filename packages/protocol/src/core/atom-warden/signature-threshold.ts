import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the minimum number of distinct SIGNER_ROLE signatures required per authorized claim. */
export async function atomWardenSignatureThreshold(
	config: ReadConfig
): Promise<AtomWardenSignatureThresholdResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'signatureThreshold',
	});
}

export type AtomWardenSignatureThresholdResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'signatureThreshold'
>;

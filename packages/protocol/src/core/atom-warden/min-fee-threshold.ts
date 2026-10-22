import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the minimum atom-wallet fee threshold required before a creator-fallback claim. */
export async function atomWardenMinFeeThreshold(
	config: ReadConfig
): Promise<AtomWardenMinFeeThresholdResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'minFeeThreshold',
	});
}

export type AtomWardenMinFeeThresholdResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'minFeeThreshold'
>;

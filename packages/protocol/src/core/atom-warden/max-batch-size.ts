import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the maximum batch size accepted by `batchGrantAtomWalletOwnership`. */
export async function atomWardenMaxBatchSize(
	config: ReadConfig
): Promise<AtomWardenMaxBatchSizeResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'MAX_BATCH_SIZE',
	});
}

export type AtomWardenMaxBatchSizeResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'MAX_BATCH_SIZE'
>;

import { AtomWardenAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/** Reads the maximum batch size accepted by `batchGrantAtomWalletOwnership`. */
export async function atomWardenMaxBatchSize(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'MAX_BATCH_SIZE',
	});
}

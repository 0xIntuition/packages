import { TrustAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

export async function trustTotalSupply(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: TrustAbi,
		functionName: 'totalSupply',
	});
}

import type { ContractFunctionArgs } from 'viem';

import { TrustBondingAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads total veTRUST supply at a timestamp using `totalSupplyAtT`.
 * @param config Contract address and public client.
 * @param inputs Function args for timestamp lookup.
 * @returns Total veTRUST supply at timestamp.
 */
export async function trustBondingTotalSupplyAtT(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view', 'totalSupplyAtT'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'totalSupplyAtT',
		args,
	});
}

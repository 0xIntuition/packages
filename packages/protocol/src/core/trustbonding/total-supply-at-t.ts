import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
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
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'totalSupplyAtT'>;
	}
): Promise<TrustBondingTotalSupplyAtTResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'totalSupplyAtT',
		args,
	});
}

export type TrustBondingTotalSupplyAtTResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'totalSupplyAtT'
>;

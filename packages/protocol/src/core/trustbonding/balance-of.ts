import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads current veTRUST balance using `balanceOf`.
 * @param config Contract address and public client.
 * @param inputs Function args for account lookup.
 * @returns Current veTRUST balance.
 */
export async function trustBondingBalanceOf(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'balanceOf'>;
	}
): Promise<TrustBondingBalanceOfResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'balanceOf',
		args,
	});
}

export type TrustBondingBalanceOfResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'balanceOf'
>;

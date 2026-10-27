import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads veTRUST balance at a timestamp using `balanceOfAtT`.
 * @param config Contract address and public client.
 * @param inputs Function args for account and timestamp.
 * @returns veTRUST balance at timestamp.
 */
export async function trustBondingBalanceOfAtT(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'balanceOfAtT'>;
	}
): Promise<TrustBondingBalanceOfAtTResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'balanceOfAtT',
		args,
	});
}

export type TrustBondingBalanceOfAtTResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'balanceOfAtT'
>;

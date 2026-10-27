import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

export async function trustBalanceOf(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustAbi, 'view' | 'pure', 'balanceOf'>;
	}
): Promise<TrustBalanceOfResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustAbi,
		functionName: 'balanceOf',
		args,
	});
}

export type TrustBalanceOfResult = ContractFunctionReturnType<
	typeof TrustAbi,
	'view' | 'pure',
	'balanceOf'
>;

import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

export async function trustAllowance(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustAbi, 'view' | 'pure', 'allowance'>;
	}
): Promise<TrustAllowanceResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustAbi,
		functionName: 'allowance',
		args,
	});
}

export type TrustAllowanceResult = ContractFunctionReturnType<
	typeof TrustAbi,
	'view' | 'pure',
	'allowance'
>;

import type { ContractFunctionArgs } from 'viem';

import { TrustAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

export async function trustAllowance(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustAbi, 'view', 'allowance'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustAbi,
		functionName: 'allowance',
		args,
	});
}

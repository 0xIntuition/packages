import type { ContractFunctionReturnType } from 'viem';
import { TrustAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

export async function trustTotalSupply(config: ReadConfig): Promise<TrustTotalSupplyResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: TrustAbi,
		functionName: 'totalSupply',
	});
}

export type TrustTotalSupplyResult = ContractFunctionReturnType<
	typeof TrustAbi,
	'view' | 'pure',
	'totalSupply'
>;

import type { ContractFunctionReturnType } from 'viem';
import { WrappedTrustAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads current WrappedTrust total supply.
 * @param config Contract address and public client.
 * @returns WrappedTrust total supply.
 */
export async function wrappedTrustTotalSupply(
	config: ReadConfig
): Promise<WrappedTrustTotalSupplyResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: WrappedTrustAbi,
		functionName: 'totalSupply',
	});
}

export type WrappedTrustTotalSupplyResult = ContractFunctionReturnType<
	typeof WrappedTrustAbi,
	'view' | 'pure',
	'totalSupply'
>;

import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the EIP-712 `CLAIM_AUTHORIZATION_TYPEHASH` used by `claimWithAuthorization`. */
export async function atomWardenClaimAuthorizationTypehash(
	config: ReadConfig
): Promise<AtomWardenClaimAuthorizationTypehashResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'CLAIM_AUTHORIZATION_TYPEHASH',
	});
}

export type AtomWardenClaimAuthorizationTypehashResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'CLAIM_AUTHORIZATION_TYPEHASH'
>;

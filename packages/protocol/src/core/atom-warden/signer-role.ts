import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the `SIGNER_ROLE` access-control role identifier. */
export async function atomWardenSignerRole(
	config: ReadConfig
): Promise<AtomWardenSignerRoleResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'SIGNER_ROLE',
	});
}

export type AtomWardenSignerRoleResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'SIGNER_ROLE'
>;

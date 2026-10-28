import type { ContractFunctionReturnType } from 'viem';
import { AtomWardenAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/** Reads the `OPERATOR_ROLE` access-control role identifier. */
export async function atomWardenOperatorRole(
	config: ReadConfig
): Promise<AtomWardenOperatorRoleResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: AtomWardenAbi,
		functionName: 'OPERATOR_ROLE',
	});
}

export type AtomWardenOperatorRoleResult = ContractFunctionReturnType<
	typeof AtomWardenAbi,
	'view' | 'pure',
	'OPERATOR_ROLE'
>;

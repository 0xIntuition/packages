import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Calculates a triple id from subject, predicate and object ids.
 * @param config Contract address and public client.
 * @param inputs Function args for triple calculation.
 * @returns Calculated triple id.
 */
export async function multiVaultCalculateTripleId(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'pure', 'calculateTripleId'>;
	}
): Promise<MultiVaultCalculateTripleIdResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'calculateTripleId',
		args,
	});
}

export type MultiVaultCalculateTripleIdResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'calculateTripleId'
>;

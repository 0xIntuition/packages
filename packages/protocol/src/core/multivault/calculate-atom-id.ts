import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Calculates an atom id from atom data via MultiVault `calculateAtomId`.
 * @param config Contract address and public client.
 * @param inputs Function args for atom data.
 * @returns Calculated atom id.
 */
export async function multiVaultCalculateAtomId(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'pure', 'calculateAtomId'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'calculateAtomId',
		args,
	});
}

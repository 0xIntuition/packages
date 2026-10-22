import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads total utilization for an epoch from the MultiVault contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the utilization query.
 * @returns Utilization data as returned by the contract.
 */
export async function multiVaultGetTotalUtilizationForEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof MultiVaultAbi,
			'view' | 'pure',
			'getTotalUtilizationForEpoch'
		>;
	}
): Promise<MultiVaultGetTotalUtilizationForEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getTotalUtilizationForEpoch',
		args,
	});
}

export type MultiVaultGetTotalUtilizationForEpochResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getTotalUtilizationForEpoch'
>;

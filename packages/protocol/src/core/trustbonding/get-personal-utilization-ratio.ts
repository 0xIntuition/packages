import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads personal utilization ratio for a user from the TrustBonding contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the utilization query.
 * @returns Personal utilization ratio as returned by the contract.
 */
export async function trustBondingGetPersonalUtilizationRatio(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof TrustBondingAbi,
			'view' | 'pure',
			'getPersonalUtilizationRatio'
		>;
	}
): Promise<TrustBondingGetPersonalUtilizationRatioResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'getPersonalUtilizationRatio',
		args,
	});
}

export type TrustBondingGetPersonalUtilizationRatioResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'getPersonalUtilizationRatio'
>;

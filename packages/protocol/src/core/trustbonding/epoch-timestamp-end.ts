import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the end timestamp for a given epoch from the TrustBonding contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the epoch query.
 * @returns Epoch end timestamp as returned by the contract.
 */
export async function trustBondingEpochTimestampEnd(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof TrustBondingAbi, 'view' | 'pure', 'epochTimestampEnd'>;
	}
): Promise<TrustBondingEpochTimestampEndResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustBondingAbi,
		functionName: 'epochTimestampEnd',
		args,
	});
}

export type TrustBondingEpochTimestampEndResult = ContractFunctionReturnType<
	typeof TrustBondingAbi,
	'view' | 'pure',
	'epochTimestampEnd'
>;

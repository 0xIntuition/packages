import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads share balance information from the MultiVault `getShares` view function.
 * @param config Contract address and public client.
 * @param inputs Function args for the share lookup.
 * @returns Contract response for the share query.
 */
export async function multiVaultGetShares(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getShares'>;
	}
): Promise<MultiVaultGetSharesResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getShares',
		args,
	});
}

export type MultiVaultGetSharesResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getShares'
>;

import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads triple data from the MultiVault `triple` view function.
 * @param config Contract address and public client.
 * @param inputs Function args for the triple lookup.
 * @returns Contract response for the triple.
 */
export async function multiVaultTriple(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'triple'>;
	}
): Promise<MultiVaultTripleResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'triple',
		args,
	});
}

export type MultiVaultTripleResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'triple'
>;

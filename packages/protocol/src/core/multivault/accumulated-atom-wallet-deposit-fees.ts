import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads accumulated atom wallet deposit fees for an atom wallet address.
 * @param config Contract address and public client.
 * @param inputs Function args for atom wallet lookup.
 * @returns Accumulated atom wallet deposit fees amount.
 */
export async function multiVaultAccumulatedAtomWalletDepositFees(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof MultiVaultAbi,
			'view' | 'pure',
			'accumulatedAtomWalletDepositFees'
		>;
	}
): Promise<MultiVaultAccumulatedAtomWalletDepositFeesResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'accumulatedAtomWalletDepositFees',
		args,
	});
}

export type MultiVaultAccumulatedAtomWalletDepositFeesResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'accumulatedAtomWalletDepositFees'
>;

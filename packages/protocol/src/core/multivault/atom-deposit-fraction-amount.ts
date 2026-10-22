import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the atom deposit fraction amount from the MultiVault contract.
 * @param config Contract address and public client.
 * @param inputs Function args for the fraction calculation.
 * @returns Deposit fraction amount as returned by the contract.
 */
export async function multiVaultAtomDepositFractionAmount(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'atomDepositFractionAmount'>;
	}
): Promise<MultiVaultAtomDepositFractionAmountResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'atomDepositFractionAmount',
		args,
	});
}

export type MultiVaultAtomDepositFractionAmountResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'atomDepositFractionAmount'
>;

import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads whether `sender` is approved to deposit on `receiver`'s behalf — the DEPOSIT
 * approval bit.
 * @param config Contract address and public client.
 * @param inputs Function args: `[sender, receiver]`.
 * @returns Whether `sender` holds DEPOSIT approval from `receiver`.
 */
export async function multiVaultIsApprovedToDeposit(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'isApprovedToDeposit'>;
	}
): Promise<MultiVaultIsApprovedToDepositResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'isApprovedToDeposit',
		args,
	});
}

export type MultiVaultIsApprovedToDepositResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'isApprovedToDeposit'
>;

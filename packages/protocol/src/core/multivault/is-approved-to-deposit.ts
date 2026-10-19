import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
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
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'isApprovedToDeposit'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'isApprovedToDeposit',
		args,
	});
}

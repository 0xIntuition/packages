import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads whether `sender` is approved to redeem on `receiver`'s behalf — the REDEMPTION
 * approval bit.
 * @param config Contract address and public client.
 * @param inputs Function args: `[sender, receiver]`.
 * @returns Whether `sender` holds REDEMPTION approval from `receiver`.
 */
export async function multiVaultIsApprovedToRedeem(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'isApprovedToRedeem'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'isApprovedToRedeem',
		args,
	});
}

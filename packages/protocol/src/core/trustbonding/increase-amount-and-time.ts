import type { ContractFunctionArgs } from 'viem';

import { TrustBondingAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type TrustBondingIncreaseAmountAndTimeInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'increase_amount_and_time'>;
};

/**
 * Simulates and submits `increase_amount_and_time` on TrustBonding.
 * @param config Contract address and viem clients.
 * @param inputs Function args for increasing lock amount and duration.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingIncreaseAmountAndTime(
	config: WriteConfig,
	inputs: TrustBondingIncreaseAmountAndTimeInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'increase_amount_and_time',
		args,
	});

	return await walletClient.writeContract(request);
}

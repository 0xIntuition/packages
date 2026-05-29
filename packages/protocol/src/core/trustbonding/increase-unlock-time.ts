import type { ContractFunctionArgs } from 'viem';

import { TrustBondingAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type TrustBondingIncreaseUnlockTimeInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'increase_unlock_time'>;
};

/**
 * Simulates and submits `increase_unlock_time` on TrustBonding.
 * @param config Contract address and viem clients.
 * @param inputs Function args for extending lock duration.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingIncreaseUnlockTime(
	config: WriteConfig,
	inputs: TrustBondingIncreaseUnlockTimeInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'increase_unlock_time',
		args,
	});

	return await walletClient.writeContract(request);
}

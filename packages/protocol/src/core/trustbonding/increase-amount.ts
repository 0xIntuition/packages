import type { ContractFunctionArgs, Hex } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type TrustBondingIncreaseAmountInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'increase_amount'>;
};

/**
 * Simulates and submits `increase_amount` on TrustBonding.
 * @param config Contract address and viem clients.
 * @param inputs Function args for lock amount increase.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingIncreaseAmount(
	config: WriteConfig,
	inputs: TrustBondingIncreaseAmountInputs
): Promise<TrustBondingIncreaseAmountResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'increase_amount',
		args,
	});

	return await walletClient.writeContract(request);
}

export type TrustBondingIncreaseAmountResult = Hex;

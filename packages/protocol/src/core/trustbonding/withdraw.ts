import type { ContractFunctionArgs, Hex } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type TrustBondingWithdrawInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'withdraw'>;
};

/**
 * Simulates and submits a TrustBonding `withdraw` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for withdrawal.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingWithdraw(
	config: WriteConfig,
	inputs: TrustBondingWithdrawInputs
): Promise<TrustBondingWithdrawResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'withdraw',
		args,
	});

	return await walletClient.writeContract(request);
}

export type TrustBondingWithdrawResult = Hex;

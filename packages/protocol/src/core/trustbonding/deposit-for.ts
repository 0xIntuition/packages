import type { ContractFunctionArgs, Hex } from 'viem';

import { TrustBondingAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type TrustBondingDepositForInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'deposit_for'>;
};

/**
 * Simulates and submits `deposit_for` on TrustBonding.
 * @param config Contract address and viem clients.
 * @param inputs Function args for deposit-for.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingDepositFor(
	config: WriteConfig,
	inputs: TrustBondingDepositForInputs
): Promise<TrustBondingDepositForResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'deposit_for',
		args,
	});

	return await walletClient.writeContract(request);
}

export type TrustBondingDepositForResult = Hex;

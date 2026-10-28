import type { ContractFunctionArgs, Hex } from 'viem';

import { WrappedTrustAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type WrappedTrustDepositInputs = {
	args: ContractFunctionArgs<typeof WrappedTrustAbi, 'payable', 'deposit'>;
	value?: bigint;
};

/**
 * Simulates and submits a WrappedTrust `deposit` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the deposit.
 * @returns Transaction hash from the wallet client.
 */
export async function wrappedTrustDeposit(
	config: WriteConfig,
	inputs: WrappedTrustDepositInputs
): Promise<WrappedTrustDepositResult> {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: WrappedTrustAbi,
		functionName: 'deposit',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

export type WrappedTrustDepositResult = Hex;

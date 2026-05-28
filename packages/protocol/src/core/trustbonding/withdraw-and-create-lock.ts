import type { ContractFunctionArgs } from 'viem';

import { TrustBondingAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type TrustBondingWithdrawAndCreateLockInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'withdraw_and_create_lock'>;
};

/**
 * Simulates and submits `withdraw_and_create_lock` on TrustBonding.
 * @param config Contract address and viem clients.
 * @param inputs Function args for withdrawing and creating a new lock.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingWithdrawAndCreateLock(
	config: WriteConfig,
	inputs: TrustBondingWithdrawAndCreateLockInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'withdraw_and_create_lock',
		args,
	});

	return await walletClient.writeContract(request);
}

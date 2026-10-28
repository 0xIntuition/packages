import type { ContractFunctionArgs, Hex } from 'viem';

import { type MultiVaultAbi, MultiVaultWithRevertsAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type DepositBatchInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'payable', 'depositBatch'>;
	value: bigint;
};

/**
 * Simulates and submits a MultiVault `depositBatch` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args and call value.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultDepositBatch(
	config: WriteConfig,
	inputs: DepositBatchInputs
): Promise<MultiVaultDepositBatchResult> {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultWithRevertsAbi,
		functionName: 'depositBatch',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

export type MultiVaultDepositBatchResult = Hex;

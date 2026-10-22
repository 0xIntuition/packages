import type { ContractFunctionArgs, Hex } from 'viem';

import { type MultiVaultAbi, MultiVaultWithRevertsAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type RedeemBatchInputs = {
	// `redeemBatch` is declared payable only so it can share a value-bearing multicall
	// with payable legs; its own value allocation must be zero.
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'payable', 'redeemBatch'>;
};

/**
 * Simulates and submits a MultiVault `redeemBatch` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for batch redeeming shares.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultRedeemBatch(
	config: WriteConfig,
	inputs: RedeemBatchInputs
): Promise<MultiVaultRedeemBatchResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultWithRevertsAbi,
		functionName: 'redeemBatch',
		args,
	});

	return await walletClient.writeContract(request);
}

export type MultiVaultRedeemBatchResult = Hex;

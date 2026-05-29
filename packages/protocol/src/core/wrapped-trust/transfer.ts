import type { ContractFunctionArgs } from 'viem';

import { WrappedTrustAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type WrappedTrustTransferInputs = {
	args: ContractFunctionArgs<typeof WrappedTrustAbi, 'nonpayable', 'transfer'>;
};

/**
 * Simulates and submits a WrappedTrust `transfer` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for transfer.
 * @returns Transaction hash from the wallet client.
 */
export async function wrappedTrustTransfer(
	config: WriteConfig,
	inputs: WrappedTrustTransferInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: WrappedTrustAbi,
		functionName: 'transfer',
		args,
	});

	return await walletClient.writeContract(request);
}

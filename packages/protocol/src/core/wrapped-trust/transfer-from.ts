import type { ContractFunctionArgs } from 'viem';

import { WrappedTrustAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type WrappedTrustTransferFromInputs = {
	args: ContractFunctionArgs<typeof WrappedTrustAbi, 'nonpayable', 'transferFrom'>;
};

/**
 * Simulates and submits a WrappedTrust `transferFrom` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for delegated transfer.
 * @returns Transaction hash from the wallet client.
 */
export async function wrappedTrustTransferFrom(
	config: WriteConfig,
	inputs: WrappedTrustTransferFromInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: WrappedTrustAbi,
		functionName: 'transferFrom',
		args,
	});

	return await walletClient.writeContract(request);
}

import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyUpdateFeeRecipientInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'nonpayable', 'updateFeeRecipient'>;
};

/**
 * Simulates and submits a FeeProxy `updateFeeRecipient` transaction — the calling affiliate
 * rotates the address its fees are paid to. Open while the affiliate row or the proxy is
 * paused.
 * @param config Contract address and viem clients.
 * @param inputs Function args.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyUpdateFeeRecipient(
	config: WriteConfig,
	inputs: FeeProxyUpdateFeeRecipientInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'updateFeeRecipient',
		args,
	});

	return await walletClient.writeContract(request);
}

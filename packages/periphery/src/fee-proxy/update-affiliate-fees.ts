import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyUpdateAffiliateFeesInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'nonpayable', 'updateAffiliateFees'>;
};

/**
 * Simulates and submits a FeeProxy `updateAffiliateFees` transaction — the calling affiliate
 * replaces its fee row. Every field must sit within the current protocol caps. Open while the
 * affiliate row or the proxy is paused.
 * @param config Contract address and viem clients.
 * @param inputs Function args.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyUpdateAffiliateFees(
	config: WriteConfig,
	inputs: FeeProxyUpdateAffiliateFeesInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'updateAffiliateFees',
		args,
	});

	return await walletClient.writeContract(request);
}

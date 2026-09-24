import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyRegisterAffiliateInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'payable', 'registerAffiliate'>;
	value: bigint;
};

/**
 * Simulates and submits a FeeProxy `registerAffiliate` transaction. `value` must
 * exactly match the current `registrationFee`.
 * @param config Contract address and viem clients.
 * @param inputs Function args and the registration fee value.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyRegisterAffiliate(
	config: WriteConfig,
	inputs: FeeProxyRegisterAffiliateInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'registerAffiliate',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

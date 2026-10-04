import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyCreateAtomsWithUrisViaInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'payable', 'createAtomsWithUrisVia'>;
	value: bigint;
};

/**
 * Simulates and submits a FeeProxy `createAtomsWithUrisVia` transaction — routes atom
 * creation with URI context through an affiliate, deducting the affiliate's creation
 * fee, forwarding the remainder to `MultiVault.createAtomsWithUris`, and refunding any
 * excess `msg.value` (push, with pull-fallback via `pendingRefund` on failure).
 * @param config Contract address and viem clients.
 * @param inputs Function args and the gross call value.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyCreateAtomsWithUrisVia(
	config: WriteConfig,
	inputs: FeeProxyCreateAtomsWithUrisViaInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'createAtomsWithUrisVia',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyCreateTriplesViaInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'payable', 'createTriplesVia'>;
	value: bigint;
};

/**
 * Simulates and submits a FeeProxy `createTriplesVia` transaction — routes triple creation
 * through an affiliate, deducting the affiliate's creation fee once on the summed gross,
 * forwarding the remainder to `MultiVault.createTriplesFor` with the caller as creator, and
 * refunding any excess `msg.value`. Each forwarded leg must still cover
 * `MultiVault.getTripleCost()`.
 * @param config Contract address and viem clients.
 * @param inputs Function args and the gross call value.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyCreateTriplesVia(
	config: WriteConfig,
	inputs: FeeProxyCreateTriplesViaInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'createTriplesVia',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

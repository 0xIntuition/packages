import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type CreateTriplesForInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'payable', 'createTriplesFor'>;
	value?: bigint;
};

/**
 * Simulates and submits a MultiVault `createTriplesFor` transaction — the on-behalf-of
 * variant of `createTriples` that credits the create-payment utilization to `creator`
 * instead of the caller. Requires `creator` to have granted the caller CREATION approval
 * unless `creator === msg.sender`.
 * @param config Contract address and viem clients.
 * @param inputs Function args and optional call value.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultCreateTriplesFor(
	config: WriteConfig,
	inputs: CreateTriplesForInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultAbi,
		functionName: 'createTriplesFor',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

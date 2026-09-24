import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type CreateAtomsForInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'payable', 'createAtomsFor'>;
	value?: bigint;
};

/**
 * Simulates and submits a MultiVault `createAtomsFor` transaction — the on-behalf-of
 * variant of `createAtoms` that attributes the resulting atoms to `creator` instead of
 * the caller. Requires `creator` to have granted the caller CREATION approval unless
 * `creator === msg.sender`.
 * @param config Contract address and viem clients.
 * @param inputs Function args and optional call value.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultCreateAtomsFor(config: WriteConfig, inputs: CreateAtomsForInputs) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultAbi,
		functionName: 'createAtomsFor',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

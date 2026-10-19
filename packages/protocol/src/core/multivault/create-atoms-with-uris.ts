import type { ContractFunctionArgs } from 'viem';

import { type MultiVaultAbi, MultiVaultWithRevertsAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type CreateAtomsWithUrisInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'payable', 'createAtomsWithUris'>;
	value?: bigint;
};

/**
 * Simulates and submits a MultiVault `createAtomsWithUris` transaction. Non-empty
 * `uris[i]` is emitted in `AtomContextRegistered` for `atomDatas[i]`, but is excluded
 * from atom ID calculation and storage. Uses the same CREATION approval rules as
 * `createAtomsFor`.
 * @param config Contract address and viem clients.
 * @param inputs Function args and optional call value.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultCreateAtomsWithUris(
	config: WriteConfig,
	inputs: CreateAtomsWithUrisInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultWithRevertsAbi,
		functionName: 'createAtomsWithUris',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

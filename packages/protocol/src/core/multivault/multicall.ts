import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type MultiVaultMulticallInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'payable', 'multicall'>;
	value?: bigint;
};

/**
 * Simulates and submits a MultiVault `multicall` transaction — executes calls on
 * MultiVault atomically with explicit per-call value allocation. The sum of the
 * per-call `values` array must equal `value` (the batch's `msg.value`). Sub-calls
 * preserve the original caller and re-evaluate their modifiers.
 * @param config Contract address and viem clients.
 * @param inputs `[data, values]` args and the batch `msg.value` (sum of `values`).
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultMulticall(config: WriteConfig, inputs: MultiVaultMulticallInputs) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultAbi,
		functionName: 'multicall',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

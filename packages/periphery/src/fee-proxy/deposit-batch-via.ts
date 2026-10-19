import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyDepositBatchViaInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'payable', 'depositBatchVia'>;
	value: bigint;
};

/**
 * Simulates and submits a FeeProxy `depositBatchVia` transaction — `depositVia` across several
 * vaults in one call. The fee, including one flat fixed fee, is computed once on the summed
 * gross and the forwarded total is split across legs pro rata to their gross, the last leg
 * taking the rounding dust.
 * @param config Contract address and viem clients.
 * @param inputs Function args and the gross call value.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyDepositBatchVia(
	config: WriteConfig,
	inputs: FeeProxyDepositBatchViaInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'depositBatchVia',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the pull-fallback refund balance owed to a user.
 * @param config Contract address and public client.
 * @param inputs Function args for the user lookup.
 * @returns The amount owed and withdrawable via `claimRefund`.
 */
export async function feeProxyPendingRefund(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'pendingRefund'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'pendingRefund',
		args,
	});
}

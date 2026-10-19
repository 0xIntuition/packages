import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyDepositViaInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'payable', 'depositVia'>;
	value: bigint;
};

/**
 * Simulates and submits a FeeProxy `depositVia` transaction — routes a single-vault deposit
 * through an affiliate, deducting the affiliate's deposit fee from `grossAssets`, forwarding
 * the remainder to `MultiVault.deposit` for `receiver`, and refunding any excess `msg.value`
 * (push, with pull-fallback via `pendingRefund` on failure). `receiver` must have approved
 * FeeProxy for DEPOSIT on MultiVault, and the caller too when `receiver` is not the caller.
 * @param config Contract address and viem clients.
 * @param inputs Function args and the gross call value.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyDepositVia(config: WriteConfig, inputs: FeeProxyDepositViaInputs) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'depositVia',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

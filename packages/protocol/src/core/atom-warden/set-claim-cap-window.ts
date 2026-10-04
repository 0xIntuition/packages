import type { ContractFunctionArgs } from 'viem';

import { AtomWardenAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomWardenSetClaimCapWindowInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setClaimCapWindow'>;
};

/**
 * Simulates and submits an AtomWarden `setClaimCapWindow` transaction. Admin-only. Must
 * be nonzero. Re-anchors the current window id under the new length while preserving
 * the in-window claim count.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new claim-cap window length (seconds).
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetClaimCapWindow(
	config: WriteConfig,
	inputs: AtomWardenSetClaimCapWindowInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setClaimCapWindow',
		args,
	});

	return await walletClient.writeContract(request);
}

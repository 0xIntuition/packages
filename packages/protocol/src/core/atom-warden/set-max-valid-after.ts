import type { ContractFunctionArgs, Hex } from 'viem';

import { AtomWardenAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type AtomWardenSetMaxValidAfterInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setMaxValidAfter'>;
};

/**
 * Simulates and submits an AtomWarden `setMaxValidAfter` transaction. Admin-only. `0`
 * forbids delayed activation entirely; `type(uint48).max` disables the cap.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new max valid-after cap.
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetMaxValidAfter(
	config: WriteConfig,
	inputs: AtomWardenSetMaxValidAfterInputs
): Promise<AtomWardenSetMaxValidAfterResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setMaxValidAfter',
		args,
	});

	return await walletClient.writeContract(request);
}

export type AtomWardenSetMaxValidAfterResult = Hex;

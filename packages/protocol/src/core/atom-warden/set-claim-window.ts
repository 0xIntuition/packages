import type { ContractFunctionArgs, Hex } from 'viem';

import { AtomWardenAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type AtomWardenSetClaimWindowInputs = {
	args: ContractFunctionArgs<typeof AtomWardenAbi, 'nonpayable', 'setClaimWindow'>;
};

/**
 * Simulates and submits an AtomWarden `setClaimWindow` transaction. Pass `0` to disable
 * the creator-fallback claim path entirely.
 * @param config Contract address and viem clients.
 * @param inputs Function args for the new claim window (seconds).
 * @returns Transaction hash from the wallet client.
 */
export async function atomWardenSetClaimWindow(
	config: WriteConfig,
	inputs: AtomWardenSetClaimWindowInputs
): Promise<AtomWardenSetClaimWindowResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: AtomWardenAbi,
		functionName: 'setClaimWindow',
		args,
	});

	return await walletClient.writeContract(request);
}

export type AtomWardenSetClaimWindowResult = Hex;

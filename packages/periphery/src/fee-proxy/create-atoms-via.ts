import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type FeeProxyCreateAtomsViaInputs = {
	args: ContractFunctionArgs<typeof FeeProxyAbi, 'payable', 'createAtomsVia'>;
	value: bigint;
};

/**
 * Simulates and submits a FeeProxy `createAtomsVia` transaction — routes atom creation through
 * an affiliate, deducting the affiliate's creation fee once on the summed gross, forwarding the
 * remainder to `MultiVault.createAtomsFor` with the caller as creator, and refunding any excess
 * `msg.value`. Each forwarded leg must still cover `MultiVault.getAtomCost()`.
 * @param config Contract address and viem clients.
 * @param inputs Function args and the gross call value.
 * @returns Transaction hash from the wallet client.
 */
export async function feeProxyCreateAtomsVia(
	config: WriteConfig,
	inputs: FeeProxyCreateAtomsViaInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: FeeProxyAbi,
		functionName: 'createAtomsVia',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

import type { ContractFunctionArgs } from 'viem';

import { MetaERC20HubAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type MetaERC20HubTransferRemoteInputs = {
	args: ContractFunctionArgs<typeof MetaERC20HubAbi, 'payable', 'transferRemote'>;
	value: bigint;
};

/**
 * Simulates and submits MetaERC20Hub `transferRemote`.
 */
export async function metaERC20HubTransferRemote(
	config: WriteConfig,
	inputs: MetaERC20HubTransferRemoteInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MetaERC20HubAbi,
		functionName: 'transferRemote',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

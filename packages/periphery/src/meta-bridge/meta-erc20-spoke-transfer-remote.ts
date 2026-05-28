import type { ContractFunctionArgs } from 'viem';

import { MetaERC20SpokeAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type MetaERC20SpokeTransferRemoteInputs = {
	args: ContractFunctionArgs<typeof MetaERC20SpokeAbi, 'payable', 'transferRemote'>;
	value: bigint;
};

/**
 * Simulates and submits MetaERC20Spoke `transferRemote`.
 */
export async function metaERC20SpokeTransferRemote(
	config: WriteConfig,
	inputs: MetaERC20SpokeTransferRemoteInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MetaERC20SpokeAbi,
		functionName: 'transferRemote',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

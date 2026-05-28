import type { ContractFunctionArgs } from 'viem';

import type { WriteConfig } from '../types';

const MetaNativeSpokeTransferRemoteAbi = [
	{
		inputs: [
			{ internalType: 'uint32', name: '_recipientDomain', type: 'uint32' },
			{ internalType: 'bytes32', name: '_recipientAddress', type: 'bytes32' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' },
		],
		name: 'transferRemote',
		outputs: [{ internalType: 'bytes32', name: 'transferId', type: 'bytes32' }],
		stateMutability: 'payable',
		type: 'function',
	},
] as const;

export type MetaNativeSpokeTransferRemoteInputs = {
	args: ContractFunctionArgs<typeof MetaNativeSpokeTransferRemoteAbi, 'payable', 'transferRemote'>;
	value: bigint;
};

/**
 * Simulates and submits MetaNativeSpoke `transferRemote` (3-arg overload).
 */
export async function metaNativeSpokeTransferRemote(
	config: WriteConfig,
	inputs: MetaNativeSpokeTransferRemoteInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MetaNativeSpokeTransferRemoteAbi,
		functionName: 'transferRemote',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

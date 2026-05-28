import type { ContractFunctionArgs } from 'viem';

import type { ReadConfig } from '../types';

const MetaNativeSpokeQuoteTransferRemoteAbi = [
	{
		inputs: [
			{ internalType: 'uint32', name: '_recipientDomain', type: 'uint32' },
			{ internalType: 'bytes32', name: '_recipientAddress', type: 'bytes32' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' },
		],
		name: 'quoteTransferRemote',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const;

export type MetaNativeSpokeQuoteTransferRemoteInputs = {
	args: ContractFunctionArgs<
		typeof MetaNativeSpokeQuoteTransferRemoteAbi,
		'view',
		'quoteTransferRemote'
	>;
};

/**
 * Reads bridge fee quote from MetaNativeSpoke `quoteTransferRemote`.
 */
export async function metaNativeSpokeQuoteTransferRemote(
	config: ReadConfig,
	inputs: MetaNativeSpokeQuoteTransferRemoteInputs
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MetaNativeSpokeQuoteTransferRemoteAbi,
		functionName: 'quoteTransferRemote',
		args,
	});
}

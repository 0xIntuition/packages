import type { ContractFunctionArgs } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type TrustSwapAndBridgeRouterSwapAndBridgeWithETHInputs = {
	args: ContractFunctionArgs<typeof TrustSwapAndBridgeRouterAbi, 'payable', 'swapAndBridgeWithETH'>;
	value: bigint;
};

/**
 * Simulates and submits a TrustSwapAndBridgeRouter `swapAndBridgeWithETH` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args and ETH value for swap + bridge fee.
 * @returns Transaction hash from the wallet client.
 */
export async function trustSwapAndBridgeRouterSwapAndBridgeWithETH(
	config: WriteConfig,
	inputs: TrustSwapAndBridgeRouterSwapAndBridgeWithETHInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'swapAndBridgeWithETH',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

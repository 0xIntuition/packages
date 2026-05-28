import type { ContractFunctionArgs } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type TrustSwapAndBridgeRouterSwapAndBridgeWithERC20Inputs = {
	args: ContractFunctionArgs<
		typeof TrustSwapAndBridgeRouterAbi,
		'payable',
		'swapAndBridgeWithERC20'
	>;
	value: bigint;
};

/**
 * Simulates and submits a TrustSwapAndBridgeRouter `swapAndBridgeWithERC20` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args and ETH value for bridge fee.
 * @returns Transaction hash from the wallet client.
 */
export async function trustSwapAndBridgeRouterSwapAndBridgeWithERC20(
	config: WriteConfig,
	inputs: TrustSwapAndBridgeRouterSwapAndBridgeWithERC20Inputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'swapAndBridgeWithERC20',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

import type { ContractFunctionArgs } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import type { WriteConfig } from '../types';

export type TrustSwapAndBridgeRouterBridgeTrustInputs = {
	args: ContractFunctionArgs<typeof TrustSwapAndBridgeRouterAbi, 'payable', 'bridgeTrust'>;
	value: bigint;
};

/**
 * Simulates and submits a TrustSwapAndBridgeRouter `bridgeTrust` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args and ETH value for bridge fee.
 * @returns Transaction hash from the wallet client.
 */
export async function trustSwapAndBridgeRouterBridgeTrust(
	config: WriteConfig,
	inputs: TrustSwapAndBridgeRouterBridgeTrustInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args, value } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'bridgeTrust',
		args,
		value,
	});

	return await walletClient.writeContract(request);
}

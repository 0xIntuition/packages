import type { ContractFunctionArgs } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import type { ReadConfig } from '../types';

export type TrustSwapAndBridgeRouterQuoteBridgeFeeInputs = {
	args: ContractFunctionArgs<typeof TrustSwapAndBridgeRouterAbi, 'view', 'quoteBridgeFee'>;
};

/**
 * Reads bridge fee quote from TrustSwapAndBridgeRouter `quoteBridgeFee`.
 * @param config Contract address and public client.
 * @param inputs Function args (trustAmount, recipient).
 * @returns Bridge fee amount in native token units.
 */
export async function trustSwapAndBridgeRouterQuoteBridgeFee(
	config: ReadConfig,
	inputs: TrustSwapAndBridgeRouterQuoteBridgeFeeInputs
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'quoteBridgeFee',
		args,
	});
}

import { type ContractFunctionArgs, zeroAddress } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import type { ReadConfig } from '../types';

export type TrustSwapAndBridgeRouterQuoteExactInputInputs = {
	args: ContractFunctionArgs<typeof TrustSwapAndBridgeRouterAbi, 'nonpayable', 'quoteExactInput'>;
};

/**
 * Calls TrustSwapAndBridgeRouter `quoteExactInput` via simulation.
 * Note: the ABI marks this function `nonpayable`, so simulation is used instead of `readContract`.
 * @param config Contract address and public client.
 * @param inputs Function args (path, amountIn).
 * @returns Expected output amount from the quoter path.
 */
export async function trustSwapAndBridgeRouterQuoteExactInput(
	config: ReadConfig,
	inputs: TrustSwapAndBridgeRouterQuoteExactInputInputs
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	const { result } = await publicClient.simulateContract({
		account: zeroAddress,
		address,
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'quoteExactInput',
		args,
	});

	return result;
}

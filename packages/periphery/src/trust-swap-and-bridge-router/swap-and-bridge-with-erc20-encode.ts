import { type Address, encodeFunctionData, type Hex } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';

/**
 * Encodes calldata for TrustSwapAndBridgeRouter `swapAndBridgeWithERC20`.
 * @param tokenIn Input token to swap.
 * @param amountIn Input token amount.
 * @param path Packed Slipstream swap path.
 * @param minTrustOut Minimum TRUST output to accept from swap.
 * @param recipient Final recipient on destination chain.
 * @returns Hex-encoded calldata for `swapAndBridgeWithERC20`.
 */
export function trustSwapAndBridgeRouterSwapAndBridgeWithERC20Encode(
	tokenIn: Address,
	amountIn: bigint,
	path: Hex,
	minTrustOut: bigint,
	recipient: Address
): Hex {
	return encodeFunctionData({
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'swapAndBridgeWithERC20',
		args: [tokenIn, amountIn, path, minTrustOut, recipient],
	});
}

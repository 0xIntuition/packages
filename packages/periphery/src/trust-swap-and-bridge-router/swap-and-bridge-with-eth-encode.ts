import { type Address, encodeFunctionData, type Hex } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';

/**
 * Encodes calldata for TrustSwapAndBridgeRouter `swapAndBridgeWithETH`.
 * @param path Packed Slipstream swap path.
 * @param minTrustOut Minimum TRUST output to accept from swap.
 * @param recipient Final recipient on destination chain.
 * @returns Hex-encoded calldata for `swapAndBridgeWithETH`.
 */
export function trustSwapAndBridgeRouterSwapAndBridgeWithETHEncode(
	path: Hex,
	minTrustOut: bigint,
	recipient: Address
): Hex {
	return encodeFunctionData({
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'swapAndBridgeWithETH',
		args: [path, minTrustOut, recipient],
	});
}

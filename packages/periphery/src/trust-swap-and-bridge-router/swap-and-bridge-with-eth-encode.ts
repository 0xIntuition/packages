import { type Address, encodeFunctionData, type Hex } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';

/**
 * Encodes calldata for TrustSwapAndBridgeRouter `swapAndBridgeWithETH`.
 * @param path Packed Slipstream swap path.
 * @param minTrustOut Minimum TRUST output to accept from swap.
 * @param recipient Final recipient on destination chain.
 * @param deadline Unix timestamp after which the swap reverts. Must satisfy
 *   `deadline >= block.timestamp` at execution; reverts with
 *   `TrustSwapAndBridgeRouter_DeadlineExpired` otherwise. Frontends should
 *   use a sensible future buffer (e.g. `now + 20 minutes`).
 * @returns Hex-encoded calldata for `swapAndBridgeWithETH`.
 */
export function trustSwapAndBridgeRouterSwapAndBridgeWithETHEncode(
	path: Hex,
	minTrustOut: bigint,
	recipient: Address,
	deadline: bigint
): Hex {
	return encodeFunctionData({
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'swapAndBridgeWithETH',
		args: [path, minTrustOut, recipient, deadline],
	});
}

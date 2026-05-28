import { type Address, encodeFunctionData, type Hex } from 'viem';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';

/**
 * Encodes calldata for TrustSwapAndBridgeRouter `bridgeTrust`.
 * @param trustAmount Amount of TRUST to bridge.
 * @param recipient Final recipient on destination chain.
 * @returns Hex-encoded calldata for `bridgeTrust`.
 */
export function trustSwapAndBridgeRouterBridgeTrustEncode(
	trustAmount: bigint,
	recipient: Address
): Hex {
	return encodeFunctionData({
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'bridgeTrust',
		args: [trustAmount, recipient],
	});
}

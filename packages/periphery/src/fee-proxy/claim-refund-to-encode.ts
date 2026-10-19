import { type Address, encodeFunctionData } from 'viem';

import { FeeProxyAbi } from '../contracts';

/**
 * Encodes calldata for the FeeProxy `claimRefundTo` function.
 * @param recipient The address that receives the refunded TRUST.
 * @returns Hex-encoded calldata for `claimRefundTo`.
 */
export function feeProxyClaimRefundToEncode(recipient: Address) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'claimRefundTo',
		args: [recipient],
	});
}

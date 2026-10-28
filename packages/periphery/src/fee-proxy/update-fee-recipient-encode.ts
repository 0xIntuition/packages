import { type Address, encodeFunctionData } from 'viem';

import { FeeProxyAbi } from '../contracts';

/**
 * Encodes calldata for the FeeProxy `updateFeeRecipient` function.
 * @param feeRecipient The new fee recipient (non-zero).
 * @returns Hex-encoded calldata for `updateFeeRecipient`.
 */
export function feeProxyUpdateFeeRecipientEncode(feeRecipient: Address) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'updateFeeRecipient',
		args: [feeRecipient],
	});
}

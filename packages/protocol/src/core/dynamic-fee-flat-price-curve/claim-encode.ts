import { encodeFunctionData, type Hex } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';

/**
 * Encodes calldata for the DynamicFeeFlatPriceCurve `claim` function.
 * @param termIds The caller's dynamic-fee vaults to settle before payout.
 * @returns Hex-encoded calldata for `claim`.
 */
export function dynamicFeeFlatPriceCurveClaimEncode(termIds: Hex[]) {
	return encodeFunctionData({
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'claim',
		args: [termIds],
	});
}

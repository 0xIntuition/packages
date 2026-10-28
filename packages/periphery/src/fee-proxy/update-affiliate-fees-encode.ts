import { encodeFunctionData } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { FeeConfig } from './types';

/**
 * Encodes calldata for the FeeProxy `updateAffiliateFees` function.
 * @param fees The new deposit and creation bps and fixed fees.
 * @returns Hex-encoded calldata for `updateAffiliateFees`.
 */
export function feeProxyUpdateAffiliateFeesEncode(fees: FeeConfig) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'updateAffiliateFees',
		args: [fees],
	});
}

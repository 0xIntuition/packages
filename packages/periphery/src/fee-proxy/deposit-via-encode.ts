import { type Address, encodeFunctionData, type Hex } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { FeeGuard } from './types';

/**
 * Encodes calldata for the FeeProxy `depositVia` function.
 * @param affiliate The affiliate mediating the deposit.
 * @param receiver The share receiver.
 * @param termId The MultiVault term to deposit into.
 * @param curveId The bonding curve to deposit on.
 * @param grossAssets The pre-fee gross asset amount.
 * @param minShares Minimum shares minted, checked against the post-fee deposit.
 * @param feeGuard Per-call front-run guard: the call reverts if the affiliate's configured fee on this side exceeds it.
 * @returns Hex-encoded calldata for `depositVia`.
 */
export function feeProxyDepositViaEncode(
	affiliate: Address,
	receiver: Address,
	termId: Hex,
	curveId: bigint,
	grossAssets: bigint,
	minShares: bigint,
	feeGuard: FeeGuard
) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'depositVia',
		args: [affiliate, receiver, termId, curveId, grossAssets, minShares, feeGuard],
	});
}

import { type Address, encodeFunctionData, type Hex } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { FeeGuard } from './types';

/**
 * Encodes calldata for the FeeProxy `depositBatchVia` function.
 * @param affiliate The affiliate mediating the batch.
 * @param receiver The share receiver for every leg.
 * @param termIds The MultiVault terms to deposit into.
 * @param curveIds The bonding curve per leg.
 * @param grossAssets The pre-fee gross assets per leg.
 * @param minShares Per-leg minimum shares, checked against each post-fee leg.
 * @param feeGuard Per-call front-run guard: the call reverts if the affiliate's configured fee on this side exceeds it.
 * @returns Hex-encoded calldata for `depositBatchVia`.
 */
export function feeProxyDepositBatchViaEncode(
	affiliate: Address,
	receiver: Address,
	termIds: Hex[],
	curveIds: bigint[],
	grossAssets: bigint[],
	minShares: bigint[],
	feeGuard: FeeGuard
) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'depositBatchVia',
		args: [affiliate, receiver, termIds, curveIds, grossAssets, minShares, feeGuard],
	});
}

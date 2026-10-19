import { type Address, encodeFunctionData, type Hex } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { FeeGuard } from './types';

/**
 * Encodes calldata for the FeeProxy `createTriplesVia` function.
 * @param affiliate The affiliate mediating the creation.
 * @param subjectIds Per-triple subject atom IDs.
 * @param predicateIds Per-triple predicate atom IDs.
 * @param objectIds Per-triple object atom IDs.
 * @param grossAssets Per-triple gross creation assets (pre-fee).
 * @param feeGuard Per-call front-run guard: the call reverts if the affiliate's configured fee on this side exceeds it.
 * @returns Hex-encoded calldata for `createTriplesVia`.
 */
export function feeProxyCreateTriplesViaEncode(
	affiliate: Address,
	subjectIds: Hex[],
	predicateIds: Hex[],
	objectIds: Hex[],
	grossAssets: bigint[],
	feeGuard: FeeGuard
) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'createTriplesVia',
		args: [affiliate, subjectIds, predicateIds, objectIds, grossAssets, feeGuard],
	});
}

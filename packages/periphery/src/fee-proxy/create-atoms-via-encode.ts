import { type Address, encodeFunctionData, type Hex } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { FeeGuard } from './types';

/**
 * Encodes calldata for the FeeProxy `createAtomsVia` function.
 * @param affiliate The affiliate mediating the creation.
 * @param atomDatas Per-atom data payloads.
 * @param grossAssets Per-atom gross creation assets (pre-fee).
 * @param feeGuard Per-call front-run guard: the call reverts if the affiliate's configured fee on this side exceeds it.
 * @returns Hex-encoded calldata for `createAtomsVia`.
 */
export function feeProxyCreateAtomsViaEncode(
	affiliate: Address,
	atomDatas: Hex[],
	grossAssets: bigint[],
	feeGuard: FeeGuard
) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'createAtomsVia',
		args: [affiliate, atomDatas, grossAssets, feeGuard],
	});
}

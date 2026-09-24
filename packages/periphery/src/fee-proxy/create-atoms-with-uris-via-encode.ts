import { type Address, encodeFunctionData, type Hex } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { FeeGuard } from './types';

/**
 * Encodes calldata for the FeeProxy `createAtomsWithUrisVia` function.
 * @param affiliate The affiliate mediating the creation.
 * @param atomDatas Per-atom data payloads.
 * @param assets Per-atom gross creation assets (pre-fee).
 * @param uris Per-atom lists of creation-time context pointers.
 * @param feeGuard Per-call front-run guard, applied to every atom.
 * @returns Hex-encoded calldata for `createAtomsWithUrisVia`.
 */
export function feeProxyCreateAtomsWithUrisViaEncode(
	affiliate: Address,
	atomDatas: Hex[],
	assets: bigint[],
	uris: Hex[][],
	feeGuard: FeeGuard
) {
	return encodeFunctionData({
		abi: FeeProxyAbi,
		functionName: 'createAtomsWithUrisVia',
		args: [affiliate, atomDatas, assets, uris, feeGuard],
	});
}

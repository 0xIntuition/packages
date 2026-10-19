import { encodeFunctionData, type Hex } from 'viem';

import { MultiVaultAbi } from '../../contracts';

/**
 * Encodes calldata for the MultiVault `multicall` function.
 * @param data ABI-encoded sub-calls to execute against MultiVault.
 * @param values Per-sub-call value allocation. Must sum to the batch's `msg.value`.
 * @returns Hex-encoded calldata for `multicall`.
 */
export function multiVaultMulticallEncode(data: Hex[], values: bigint[]) {
	return encodeFunctionData({
		abi: MultiVaultAbi,
		functionName: 'multicall',
		args: [data, values],
	});
}

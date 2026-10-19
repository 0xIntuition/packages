import { type Address, encodeFunctionData, type Hex } from 'viem';

import { MultiVaultAbi } from '../../contracts';

/**
 * Encodes calldata for the MultiVault `createAtomsWithUris` function.
 * @param creator The address recorded as atom creator and context registrant.
 * @param data Atom data payloads as hex.
 * @param assets Asset amounts to deposit for each atom.
 * @param uris Per-atom lists of creation-time context pointers.
 * @returns Hex-encoded calldata for `createAtomsWithUris`.
 */
export function multiVaultCreateAtomsWithUrisEncode(
	creator: Address,
	data: Hex[],
	assets: bigint[],
	uris: Hex[][]
) {
	return encodeFunctionData({
		abi: MultiVaultAbi,
		functionName: 'createAtomsWithUris',
		args: [creator, data, assets, uris],
	});
}

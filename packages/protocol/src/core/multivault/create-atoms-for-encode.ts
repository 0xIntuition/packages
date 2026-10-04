import { type Address, encodeFunctionData, type Hex } from 'viem';

import { MultiVaultAbi } from '../../contracts';

/**
 * Encodes calldata for the MultiVault `createAtomsFor` function.
 * @param creator The address recorded as atom creator and credited with create-payment utilization.
 * @param data Atom data payloads as hex.
 * @param assets Asset amounts to deposit for each atom.
 * @returns Hex-encoded calldata for `createAtomsFor`.
 */
export function multiVaultCreateAtomsForEncode(creator: Address, data: Hex[], assets: bigint[]) {
	return encodeFunctionData({
		abi: MultiVaultAbi,
		functionName: 'createAtomsFor',
		args: [creator, data, assets],
	});
}

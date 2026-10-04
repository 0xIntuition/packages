import { type Address, encodeFunctionData, type Hex } from 'viem';

import { MultiVaultAbi } from '../../contracts';

/**
 * Encodes calldata for the MultiVault `createTriplesFor` function.
 * @param creator The address credited with the create-payment utilization.
 * @param subjectIds Subject atom IDs.
 * @param predicateIds Predicate atom IDs.
 * @param objectIds Object atom IDs.
 * @param assets Asset amounts to deposit for each triple.
 * @returns Hex-encoded calldata for `createTriplesFor`.
 */
export function multiVaultCreateTriplesForEncode(
	creator: Address,
	subjectIds: Hex[],
	predicateIds: Hex[],
	objectIds: Hex[],
	assets: bigint[]
) {
	return encodeFunctionData({
		abi: MultiVaultAbi,
		functionName: 'createTriplesFor',
		args: [creator, subjectIds, predicateIds, objectIds, assets],
	});
}

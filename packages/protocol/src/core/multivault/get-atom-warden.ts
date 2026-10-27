import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads atom warden address from MultiVault `getAtomWarden`.
 * @param config Contract address and public client.
 * @returns Atom warden address.
 */
export async function multiVaultGetAtomWarden(
	config: ReadConfig
): Promise<MultiVaultGetAtomWardenResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtomWarden',
	});
}

export type MultiVaultGetAtomWardenResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getAtomWarden'
>;

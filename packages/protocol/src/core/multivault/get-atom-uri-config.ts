import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads MultiVault's atom URI bounds — the maximum number of context URIs allowed per
 * atom and the maximum byte length allowed per URI. `createAtomsWithUris` reverts if
 * either bound is exceeded.
 * @param config Contract address and public client.
 * @returns `[maxUriCount, maxUriLength]`.
 */
export async function multiVaultGetAtomUriConfig(
	config: ReadConfig
): Promise<MultiVaultGetAtomUriConfigResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getAtomUriConfig',
	});
}

export type MultiVaultGetAtomUriConfigResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getAtomUriConfig'
>;

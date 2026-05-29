import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the deterministic atom wallet address from MultiVault `computeAtomWalletAddr`.
 * @param config Contract address and public client.
 * @param inputs Function args for atom id.
 * @returns Computed atom wallet address.
 */
export async function multiVaultComputeAtomWalletAddr(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'computeAtomWalletAddr'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'computeAtomWalletAddr',
		args,
	});
}

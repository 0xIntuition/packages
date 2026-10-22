import type { ContractFunctionReturnType } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the bonding curve configuration from the MultiVault contract.
 * @param config Contract address and public client.
 * @returns Bonding curve configuration struct from the contract.
 */
export async function multiVaultGetBondingCurveConfig(
	config: ReadConfig
): Promise<MultiVaultGetBondingCurveConfigResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'getBondingCurveConfig',
	});
}

export type MultiVaultGetBondingCurveConfigResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'getBondingCurveConfig'
>;

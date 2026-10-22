import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads a vault's cumulative net user stake on the dynamic-fee curve — the quantity
 * the tier ladder is keyed on.
 * @param config Contract address and public client.
 * @param inputs Function args for the term lookup.
 * @returns The vault's current cumulative net stake.
 */
export async function dynamicFeeFlatPriceCurveVaultStake(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view' | 'pure', 'vaultStake'>;
	}
): Promise<DynamicFeeFlatPriceCurveVaultStakeResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'vaultStake',
		args,
	});
}

export type DynamicFeeFlatPriceCurveVaultStakeResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'vaultStake'
>;

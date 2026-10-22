import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { BondingCurveRegistryAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Resolves a bonding curve's deployed address from the BondingCurveRegistry by curve ID.
 * @param config Contract address and public client.
 * @param inputs Function args for the curve ID lookup.
 * @returns The curve's deployed address.
 */
export async function bondingCurveRegistryCurveAddresses(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof BondingCurveRegistryAbi, 'view' | 'pure', 'curveAddresses'>;
	}
): Promise<BondingCurveRegistryCurveAddressesResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: BondingCurveRegistryAbi,
		functionName: 'curveAddresses',
		args,
	});
}

export type BondingCurveRegistryCurveAddressesResult = ContractFunctionReturnType<
	typeof BondingCurveRegistryAbi,
	'view' | 'pure',
	'curveAddresses'
>;

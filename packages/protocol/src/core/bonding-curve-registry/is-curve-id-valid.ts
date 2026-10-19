import type { ContractFunctionArgs } from 'viem';

import { BondingCurveRegistryAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reports whether a curve id is within the registered range, without having to compare an
 * address against the zero address to find out.
 * @param config Contract address and public client.
 * @param inputs Function args for the lookup.
 * @returns True if the id resolves to a registered curve.
 */
export async function bondingCurveRegistryIsCurveIdValid(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof BondingCurveRegistryAbi, 'view', 'isCurveIdValid'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: BondingCurveRegistryAbi,
		functionName: 'isCurveIdValid',
		args,
	});
}

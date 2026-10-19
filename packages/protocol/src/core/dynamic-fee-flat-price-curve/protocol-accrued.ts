import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the fee residue the curve has accrued to the protocol — amounts that found no eligible
 * recipient tier and fell through to `sweepProtocol`.
 * @param config Contract address and public client.
 * @returns The accrued protocol balance.
 */
export async function dynamicFeeFlatPriceCurveProtocolAccrued(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'protocolAccrued',
	});
}

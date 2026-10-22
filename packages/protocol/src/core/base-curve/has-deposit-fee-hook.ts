import { IBaseCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reports whether a curve charges a curve-level fee on deposits. When it does, MultiVault's own
 * deposit maths is not the whole story and the curve has to be quoted as well.
 * @param config Curve address and public client.
 * @returns True if the curve implements the deposit fee hook.
 */
export async function baseCurveHasDepositFeeHook(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'hasDepositFeeHook',
	});
}

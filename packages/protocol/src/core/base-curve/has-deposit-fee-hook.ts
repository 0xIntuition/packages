import type { ContractFunctionReturnType } from 'viem';
import { IBaseCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reports whether a curve charges a curve-level fee on deposits. When it does, MultiVault's own
 * deposit maths is not the whole story and the curve has to be quoted as well.
 * @param config Curve address and public client.
 * @returns True if the curve implements the deposit fee hook.
 */
export async function baseCurveHasDepositFeeHook(
	config: ReadConfig
): Promise<BaseCurveHasDepositFeeHookResult> {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'hasDepositFeeHook',
	});
}

export type BaseCurveHasDepositFeeHookResult = ContractFunctionReturnType<
	typeof IBaseCurveAbi,
	'view' | 'pure',
	'hasDepositFeeHook'
>;

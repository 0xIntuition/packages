import { IBaseCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reports whether a curve charges a curve-level fee on redemptions.
 *
 * This is what tells a caller that MultiVault's `previewRedeem` — which quotes the hook with
 * `address(0)` — is a holder-agnostic figure rather than a specific account's payout.
 * @param config Curve address and public client.
 * @returns True if the curve implements the redeem fee hook.
 */
export async function baseCurveHasRedeemFeeHook(config: ReadConfig) {
	const { address, publicClient } = config;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'hasRedeemFeeHook',
	});
}

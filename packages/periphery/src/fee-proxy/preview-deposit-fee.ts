import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the effective deposit-side fee math for an affiliate applied to gross assets:
 * `gross * depositBps / 10_000` (floored) plus the flat `depositFixedFee`. Does not check
 * registration, pause, caps or guards; an unregistered affiliate previews a zero fee.
 * @param config Contract address and public client.
 * @param inputs Function args: the affiliate and the pre-fee gross asset amount.
 * @returns `[fee, forwarded]` — the affiliate fee that would be deducted, and the amount that would be forwarded to MultiVault (zero when the fee would reach the gross).
 */
export async function feeProxyPreviewDepositFee(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'previewDepositFee'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'previewDepositFee',
		args,
	});
}

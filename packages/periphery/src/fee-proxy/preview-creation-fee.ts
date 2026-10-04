import type { ContractFunctionArgs } from 'viem';

import { FeeProxyAbi } from '../contracts';
import type { ReadConfig } from '../types';

/**
 * Reads the effective creation-side fee math for an affiliate applied to gross assets.
 * @param config Contract address and public client.
 * @param inputs Function args: the affiliate and the pre-fee gross asset amount.
 * @returns `[fee, forwarded]` — the affiliate fee that would be deducted, and the amount that would be forwarded to MultiVault.
 */
export async function feeProxyPreviewCreationFee(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof FeeProxyAbi, 'view', 'previewCreationFee'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: FeeProxyAbi,
		functionName: 'previewCreationFee',
		args,
	});
}

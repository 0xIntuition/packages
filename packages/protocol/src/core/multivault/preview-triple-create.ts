import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

export type MultiVaultPreviewTripleCreateInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'previewTripleCreate'>;
};

/**
 * Previews the result of a triple creation using `previewTripleCreate`.
 * @param config Contract address and public client.
 * @param inputs Function args for previewing triple creation.
 * @returns Contract response for expected shares and assets after fees.
 */
export async function multiVaultPreviewTripleCreate(
	config: ReadConfig,
	inputs: MultiVaultPreviewTripleCreateInputs
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'previewTripleCreate',
		args,
	});
}

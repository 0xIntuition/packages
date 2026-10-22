import type { ContractFunctionArgs } from 'viem';

import { type MultiVaultAbi, MultiVaultWithRevertsAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

export type MultiVaultPreviewTripleCreateInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'previewTripleCreate'>;
};

/**
 * Previews the result of a triple creation using `previewTripleCreate`.
 * Takes the three atom ids of the triple to be created, not the triple id: the contract evaluates
 * the atom-deposit fraction against the atom vaults, which is the only way to quote a triple that
 * does not exist yet correctly.
 * @param config Contract address and public client.
 * @param inputs Function args: `[subjectId, predicateId, objectId, assets]`.
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
		abi: MultiVaultWithRevertsAbi,
		functionName: 'previewTripleCreate',
		args,
	});
}

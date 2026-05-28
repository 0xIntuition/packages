import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads whether a term is an atom from MultiVault `isAtom`.
 * @param config Contract address and public client.
 * @param inputs Function args for term lookup.
 * @returns Boolean indicating if the term is an atom.
 */
export async function multiVaultIsAtom(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'isAtom'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'isAtom',
		args,
	});
}

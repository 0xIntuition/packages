import type { ContractFunctionArgs } from 'viem';

import { WrappedTrustAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads ERC20 allowance from the WrappedTrust contract.
 * @param config Contract address and public client.
 * @param inputs Function args for owner and spender.
 * @returns Current allowance as returned by the contract.
 */
export async function wrappedTrustAllowance(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof WrappedTrustAbi, 'view', 'allowance'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: WrappedTrustAbi,
		functionName: 'allowance',
		args,
	});
}

import type { ContractFunctionArgs } from 'viem';

import { MetaERC20SpokeAbi } from '../contracts';
import type { ReadConfig } from '../types';

export type MetaERC20SpokeQuoteTransferRemoteInputs = {
	args: ContractFunctionArgs<typeof MetaERC20SpokeAbi, 'view', 'quoteTransferRemote'>;
};

/**
 * Reads bridge fee quote from MetaERC20Spoke `quoteTransferRemote`.
 */
export async function metaERC20SpokeQuoteTransferRemote(
	config: ReadConfig,
	inputs: MetaERC20SpokeQuoteTransferRemoteInputs
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MetaERC20SpokeAbi,
		functionName: 'quoteTransferRemote',
		args,
	});
}

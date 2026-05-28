import type { ContractFunctionArgs } from 'viem';

import { MetaERC20HubAbi } from '../contracts';
import type { ReadConfig } from '../types';

export type MetaERC20HubQuoteTransferRemoteInputs = {
	args: ContractFunctionArgs<typeof MetaERC20HubAbi, 'view', 'quoteTransferRemote'>;
};

/**
 * Reads bridge fee quote from MetaERC20Hub `quoteTransferRemote`.
 */
export async function metaERC20HubQuoteTransferRemote(
	config: ReadConfig,
	inputs: MetaERC20HubQuoteTransferRemoteInputs
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MetaERC20HubAbi,
		functionName: 'quoteTransferRemote',
		args,
	});
}

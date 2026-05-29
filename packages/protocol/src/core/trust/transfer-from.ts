import type { ContractFunctionArgs } from 'viem';

import { TrustAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type TrustTransferFromInputs = {
	args: ContractFunctionArgs<typeof TrustAbi, 'nonpayable', 'transferFrom'>;
};

export async function trustTransferFrom(config: WriteConfig, inputs: TrustTransferFromInputs) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustAbi,
		functionName: 'transferFrom',
		args,
	});

	return await walletClient.writeContract(request);
}

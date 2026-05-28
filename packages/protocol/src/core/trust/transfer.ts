import type { ContractFunctionArgs } from 'viem';

import { TrustAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type TrustTransferInputs = {
	args: ContractFunctionArgs<typeof TrustAbi, 'nonpayable', 'transfer'>;
};

export async function trustTransfer(config: WriteConfig, inputs: TrustTransferInputs) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustAbi,
		functionName: 'transfer',
		args,
	});

	return await walletClient.writeContract(request);
}

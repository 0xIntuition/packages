import type { ContractFunctionArgs, Hex } from 'viem';

import { TrustAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type TrustTransferInputs = {
	args: ContractFunctionArgs<typeof TrustAbi, 'nonpayable', 'transfer'>;
};

export async function trustTransfer(
	config: WriteConfig,
	inputs: TrustTransferInputs
): Promise<TrustTransferResult> {
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

export type TrustTransferResult = Hex;

import type { ContractFunctionArgs, Hex } from 'viem';

import { TrustAbi } from '../../contracts/abis';
import type { WriteConfig } from '../../types';

export type TrustApproveInputs = {
	args: ContractFunctionArgs<typeof TrustAbi, 'nonpayable', 'approve'>;
};

export async function trustApprove(
	config: WriteConfig,
	inputs: TrustApproveInputs
): Promise<TrustApproveResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustAbi,
		functionName: 'approve',
		args,
	});

	return await walletClient.writeContract(request);
}

export type TrustApproveResult = Hex;

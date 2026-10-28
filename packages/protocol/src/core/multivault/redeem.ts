import type { Address, ContractFunctionArgs, Hex, PublicClient, WalletClient } from 'viem';

import { type MultiVaultAbi, MultiVaultWithRevertsAbi } from '../../contracts/abis';

export type RedeemConfig = {
	address: Address;
	walletClient: WalletClient;
	publicClient: PublicClient;
};

export type RedeemInputs = {
	// `redeem` is declared payable only so it can share a value-bearing multicall with
	// payable legs; its own value allocation must be zero.
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'payable', 'redeem'>;
};

/**
 * Simulates and submits a MultiVault `redeem` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for redeeming shares.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultRedeem(
	config: RedeemConfig,
	inputs: RedeemInputs
): Promise<MultiVaultRedeemResult> {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultWithRevertsAbi,
		functionName: 'redeem',
		args,
	});

	return await walletClient.writeContract(request);
}

export type MultiVaultRedeemResult = Hex;

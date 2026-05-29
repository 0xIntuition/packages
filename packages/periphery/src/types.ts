import type { Address, PublicClient, WalletClient } from 'viem';

export type ReadConfig = {
	address: Address;
	publicClient: PublicClient;
};

export type WriteConfig = {
	address: Address;
	walletClient: WalletClient;
	publicClient: PublicClient;
};

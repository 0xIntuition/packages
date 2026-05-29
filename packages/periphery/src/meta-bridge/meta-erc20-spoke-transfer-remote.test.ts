import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { metaERC20SpokeTransferRemote } from './meta-erc20-spoke-transfer-remote';

describe('metaERC20SpokeTransferRemote', () => {
	it('simulates and writes transferRemote transaction', async () => {
		const address = '0xFB4BAa05BF339AD6074047176F90757A6C87f944' as Address;
		const hash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as Hex;
		const account = {
			address: '0xdddddddddddddddddddddddddddddddddddddddd' as Address,
		} as WalletClient['account'];
		const request = { to: address, data: '0x1234' as Hex };
		const recipient = '0x000000000000000000000000b8e3452e62b45e654a300a296061597e3cf3e039' as const;
		const value = 12_345n;

		const simulateContract = vi.fn().mockResolvedValue({ request });
		const writeContract = vi.fn().mockResolvedValue(hash);

		const publicClient = { simulateContract } as unknown as PublicClient;
		const walletClient = { account, writeContract } as unknown as WalletClient;

		const txHash = await metaERC20SpokeTransferRemote(
			{
				address,
				publicClient,
				walletClient,
			},
			{
				args: [8453, recipient, 2_000_000_000_000_000_000n],
				value,
			}
		);

		expect(txHash).toBe(hash);
		expect(simulateContract).toHaveBeenCalledWith(
			expect.objectContaining({
				account,
				address,
				functionName: 'transferRemote',
				args: [8453, recipient, 2_000_000_000_000_000_000n],
				value,
			})
		);
		expect(writeContract).toHaveBeenCalledWith(request);
	});
});

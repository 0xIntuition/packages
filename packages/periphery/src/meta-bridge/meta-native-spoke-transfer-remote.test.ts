import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { metaNativeSpokeTransferRemote } from './meta-native-spoke-transfer-remote';

describe('metaNativeSpokeTransferRemote', () => {
	it('simulates and writes the 3-arg transferRemote overload', async () => {
		const address = '0x375135fe908dD62f3C7939FA4e65bf41Da721AB9' as Address;
		const hash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as Hex;
		const account = {
			address: '0xdddddddddddddddddddddddddddddddddddddddd' as Address,
		} as WalletClient['account'];
		const request = { to: address, data: '0x1234' as Hex };
		const recipient = '0x000000000000000000000000b8e3452e62b45e654a300a296061597e3cf3e039' as const;
		const value = 2_000_000_000_000_000_123n;

		const simulateContract = vi.fn().mockResolvedValue({ request });
		const writeContract = vi.fn().mockResolvedValue(hash);

		const publicClient = { simulateContract } as unknown as PublicClient;
		const walletClient = { account, writeContract } as unknown as WalletClient;

		const txHash = await metaNativeSpokeTransferRemote(
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

import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { trustSwapAndBridgeRouterSwapAndBridgeWithETH } from './swap-and-bridge-with-eth';

describe('trustSwapAndBridgeRouterSwapAndBridgeWithETH', () => {
	it('simulates and writes swapAndBridgeWithETH transaction', async () => {
		const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
		const path =
			'0x4200000000000000000000000000000000000006000032833589fcd6edb6e08f4c7c32d4f71b54bda029130000016cd905df2ed214b22e0d48ff17cd4200c1c6d8a3' as Hex;
		const minTrustOut = 1n;
		const recipient = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address;
		const value = 2_000_000_000_000_000n;
		const hash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as Hex;
		const account = {
			address: '0xdddddddddddddddddddddddddddddddddddddddd' as Address,
		} as WalletClient['account'];
		const request = { to: address, data: '0x1234' as Hex };

		const simulateContract = vi.fn().mockResolvedValue({ request });
		const writeContract = vi.fn().mockResolvedValue(hash);

		const publicClient = { simulateContract } as unknown as PublicClient;
		const walletClient = { account, writeContract } as unknown as WalletClient;

		const txHash = await trustSwapAndBridgeRouterSwapAndBridgeWithETH(
			{
				address,
				publicClient,
				walletClient,
			},
			{
				args: [path, minTrustOut, recipient],
				value,
			}
		);

		expect(txHash).toBe(hash);
		expect(simulateContract).toHaveBeenCalledWith(
			expect.objectContaining({
				account,
				address,
				functionName: 'swapAndBridgeWithETH',
				args: [path, minTrustOut, recipient],
				value,
			})
		);
		expect(writeContract).toHaveBeenCalledWith(request);
	});
});

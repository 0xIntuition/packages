import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { trustSwapAndBridgeRouterSwapAndBridgeWithERC20 } from './swap-and-bridge-with-erc20';

describe('trustSwapAndBridgeRouterSwapAndBridgeWithERC20', () => {
	it('simulates and writes swapAndBridgeWithERC20 transaction', async () => {
		const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
		const tokenIn = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as Address;
		const amountIn = 1_000_000n;
		const path =
			'0x833589fcd6edb6e08f4c7c32d4f71b54bda029130000016cd905df2ed214b22e0d48ff17cd4200c1c6d8a3' as Hex;
		const minTrustOut = 1n;
		const recipient = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address;
		const value = 1_000_000_000_000_000n;
		const hash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as Hex;
		const account = {
			address: '0xdddddddddddddddddddddddddddddddddddddddd' as Address,
		} as WalletClient['account'];
		const request = { to: address, data: '0x1234' as Hex };

		const simulateContract = vi.fn().mockResolvedValue({ request });
		const writeContract = vi.fn().mockResolvedValue(hash);

		const publicClient = { simulateContract } as unknown as PublicClient;
		const walletClient = { account, writeContract } as unknown as WalletClient;

		const txHash = await trustSwapAndBridgeRouterSwapAndBridgeWithERC20(
			{
				address,
				publicClient,
				walletClient,
			},
			{
				args: [tokenIn, amountIn, path, minTrustOut, recipient],
				value,
			}
		);

		expect(txHash).toBe(hash);
		expect(simulateContract).toHaveBeenCalledWith(
			expect.objectContaining({
				account,
				address,
				functionName: 'swapAndBridgeWithERC20',
				args: [tokenIn, amountIn, path, minTrustOut, recipient],
				value,
			})
		);
		expect(writeContract).toHaveBeenCalledWith(request);
	});
});

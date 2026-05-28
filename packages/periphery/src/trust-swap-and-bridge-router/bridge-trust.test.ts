import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { trustSwapAndBridgeRouterBridgeTrust } from './bridge-trust';

describe('trustSwapAndBridgeRouterBridgeTrust', () => {
	it('simulates and writes a bridgeTrust transaction', async () => {
		const routerAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
		const recipient = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address;
		const trustAmount = 25n * 10n ** 18n;
		const value = 1_000_000_000_000_000n;
		const txHash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as Hex;
		const account = {
			address: '0xdddddddddddddddddddddddddddddddddddddddd' as Address,
		} as WalletClient['account'];
		const request = { to: routerAddress, data: '0x1234' as Hex };

		const simulateContract = vi.fn().mockResolvedValue({ request });
		const writeContract = vi.fn().mockResolvedValue(txHash);

		const publicClient = { simulateContract } as unknown as PublicClient;
		const walletClient = { account, writeContract } as unknown as WalletClient;

		const hash = await trustSwapAndBridgeRouterBridgeTrust(
			{
				address: routerAddress,
				publicClient,
				walletClient,
			},
			{
				args: [trustAmount, recipient],
				value,
			}
		);

		expect(hash).toBe(txHash);
		expect(simulateContract).toHaveBeenCalledTimes(1);
		expect(simulateContract).toHaveBeenCalledWith(
			expect.objectContaining({
				account,
				address: routerAddress,
				functionName: 'bridgeTrust',
				args: [trustAmount, recipient],
				value,
			})
		);
		expect(writeContract).toHaveBeenCalledWith(request);
	});
});

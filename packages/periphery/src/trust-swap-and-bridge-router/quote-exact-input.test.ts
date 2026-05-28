import type { Address, Hex, PublicClient } from 'viem';
import { zeroAddress } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { trustSwapAndBridgeRouterQuoteExactInput } from './quote-exact-input';

describe('trustSwapAndBridgeRouterQuoteExactInput', () => {
	it('simulates quoteExactInput and returns amountOut', async () => {
		const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
		const path =
			'0x833589fcd6edb6e08f4c7c32d4f71b54bda029130000016cd905df2ed214b22e0d48ff17cd4200c1c6d8a3' as Hex;
		const amountIn = 1_000_000n;
		const quote = 321n;
		const simulateContract = vi.fn().mockResolvedValue({ result: quote });
		const publicClient = { simulateContract } as unknown as PublicClient;

		const result = await trustSwapAndBridgeRouterQuoteExactInput(
			{
				address,
				publicClient,
			},
			{
				args: [path, amountIn],
			}
		);

		expect(result).toBe(quote);
		expect(simulateContract).toHaveBeenCalledTimes(1);
		expect(simulateContract).toHaveBeenCalledWith(
			expect.objectContaining({
				account: zeroAddress,
				address,
				functionName: 'quoteExactInput',
				args: [path, amountIn],
			})
		);
	});
});

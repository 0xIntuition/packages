import type { Address, PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { trustSwapAndBridgeRouterQuoteBridgeFee } from './quote-bridge-fee';

describe('trustSwapAndBridgeRouterQuoteBridgeFee', () => {
	it('reads bridge fee with expected args', async () => {
		const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
		const recipient = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address;
		const bridgeFee = 1_000_000_000_000_000n;
		const readContract = vi.fn().mockResolvedValue(bridgeFee);
		const publicClient = { readContract } as unknown as PublicClient;

		const result = await trustSwapAndBridgeRouterQuoteBridgeFee(
			{
				address,
				publicClient,
			},
			{
				args: [10n ** 18n, recipient],
			}
		);

		expect(result).toBe(bridgeFee);
		expect(readContract).toHaveBeenCalledTimes(1);
		expect(readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address,
				functionName: 'quoteBridgeFee',
				args: [10n ** 18n, recipient],
			})
		);
	});
});

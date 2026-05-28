import type { Address, PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { metaNativeSpokeQuoteTransferRemote } from './meta-native-spoke-quote-transfer-remote';

describe('metaNativeSpokeQuoteTransferRemote', () => {
	it('reads quoteTransferRemote with expected args', async () => {
		const address = '0x375135fe908dD62f3C7939FA4e65bf41Da721AB9' as Address;
		const recipient = '0x000000000000000000000000b8e3452e62b45e654a300a296061597e3cf3e039' as const;
		const quote = 77n;
		const readContract = vi.fn().mockResolvedValue(quote);
		const publicClient = { readContract } as unknown as PublicClient;

		const result = await metaNativeSpokeQuoteTransferRemote(
			{
				address,
				publicClient,
			},
			{
				args: [8453, recipient, 2_000_000_000_000_000_000n],
			}
		);

		expect(result).toBe(quote);
		expect(readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address,
				functionName: 'quoteTransferRemote',
				args: [8453, recipient, 2_000_000_000_000_000_000n],
			})
		);
	});
});

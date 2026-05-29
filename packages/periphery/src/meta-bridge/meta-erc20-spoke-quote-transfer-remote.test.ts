import type { Address, PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { metaERC20SpokeQuoteTransferRemote } from './meta-erc20-spoke-quote-transfer-remote';

describe('metaERC20SpokeQuoteTransferRemote', () => {
	it('reads quoteTransferRemote with expected args', async () => {
		const address = '0xFB4BAa05BF339AD6074047176F90757A6C87f944' as Address;
		const recipient = '0x000000000000000000000000b8e3452e62b45e654a300a296061597e3cf3e039' as const;
		const quote = 98_765n;
		const readContract = vi.fn().mockResolvedValue(quote);
		const publicClient = { readContract } as unknown as PublicClient;

		const result = await metaERC20SpokeQuoteTransferRemote(
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

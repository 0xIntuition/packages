import type { Address, PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { metaERC20HubQuoteTransferRemote } from './meta-erc20-hub-quote-transfer-remote';

describe('metaERC20HubQuoteTransferRemote', () => {
	it('reads quoteTransferRemote with expected args', async () => {
		const address = '0x7e41962bE9B2640e653BfA8c8713A905659FE157' as Address;
		const recipient = '0x000000000000000000000000b8e3452e62b45e654a300a296061597e3cf3e039' as const;
		const quote = 12_345n;
		const readContract = vi.fn().mockResolvedValue(quote);
		const publicClient = { readContract } as unknown as PublicClient;

		const result = await metaERC20HubQuoteTransferRemote(
			{
				address,
				publicClient,
			},
			{
				args: [1155, recipient, 2_000_000_000_000_000_000n],
			}
		);

		expect(result).toBe(quote);
		expect(readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address,
				functionName: 'quoteTransferRemote',
				args: [1155, recipient, 2_000_000_000_000_000_000n],
			})
		);
	});
});

import type { Address, PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { multiVaultMultiCallIntuitionConfigs } from './multicall-intuition-config';

const E18 = 10n ** 18n;
const MULTIVAULT_ADDRESS = '0x0000000000000000000000000000000000000001' as Address;
const CUSTOM_MULTICALL_ADDRESS = '0x1111111111111111111111111111111111111111' as Address;
const DEFAULT_MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as Address;

function makeSuccessMulticallResult() {
	return [
		{ status: 'success', result: 1n * E18 },
		{ status: 'success', result: 2n * E18 },
		{ status: 'success', result: [3n * E18, 4n * E18] },
		{ status: 'success', result: [5n * E18, 6n * E18] },
		{ status: 'success', result: [7n * E18, 8n * E18, 9n * E18] },
		{ status: 'success', result: [0n, 0n, 10n * E18, 0n, 11n * E18] },
	] as const;
}

describe('multiVaultMultiCallIntuitionConfigs', () => {
	it('uses multicall results when all calls succeed', async () => {
		const multicall = vi.fn().mockResolvedValue(makeSuccessMulticallResult());
		const readContract = vi.fn();
		const publicClient = {
			multicall,
			readContract,
		} as unknown as PublicClient;

		const result = await multiVaultMultiCallIntuitionConfigs({
			address: MULTIVAULT_ADDRESS,
			publicClient,
		});

		expect(readContract).not.toHaveBeenCalled();
		expect(multicall).toHaveBeenCalledWith(
			expect.objectContaining({ multicallAddress: DEFAULT_MULTICALL_ADDRESS })
		);
		expect(result.atom_cost).toBe((1n * E18).toString());
		expect(result.triple_cost).toBe((2n * E18).toString());
		expect(result.entry_fee).toBe((7n * E18).toString());
		expect(result.protocol_fee).toBe((9n * E18).toString());
		expect(result.min_deposit).toBe((11n * E18).toString());
		expect(result.formatted_atom_cost).toBe('1');
		expect(result.formatted_triple_cost).toBe('2');
	});

	it('falls back to readContract when any multicall item fails', async () => {
		const multicall = vi.fn().mockResolvedValue([
			{ status: 'failure', error: new Error('failed') },
			{ status: 'success', result: 0n },
			{ status: 'success', result: [0n, 0n] },
			{ status: 'success', result: [0n, 0n] },
			{ status: 'success', result: [0n, 0n, 0n] },
			{ status: 'success', result: [0n, 0n, 0n, 0n, 0n] },
		]);
		const readContract = vi
			.fn()
			.mockResolvedValueOnce(12n * E18)
			.mockResolvedValueOnce(13n * E18)
			.mockResolvedValueOnce([14n * E18, 15n * E18])
			.mockResolvedValueOnce([16n * E18, 17n * E18])
			.mockResolvedValueOnce([18n * E18, 19n * E18, 20n * E18])
			.mockResolvedValueOnce([0n, 0n, 21n * E18, 0n, 22n * E18]);
		const publicClient = {
			chain: {
				contracts: {
					multicall3: {
						address: CUSTOM_MULTICALL_ADDRESS,
					},
				},
			},
			multicall,
			readContract,
		} as unknown as PublicClient;

		const result = await multiVaultMultiCallIntuitionConfigs({
			address: MULTIVAULT_ADDRESS,
			publicClient,
		});

		expect(multicall).toHaveBeenCalledWith(
			expect.objectContaining({ multicallAddress: CUSTOM_MULTICALL_ADDRESS })
		);
		expect(readContract).toHaveBeenCalledTimes(6);
		expect(result.atom_cost).toBe((12n * E18).toString());
		expect(result.triple_cost).toBe((13n * E18).toString());
		expect(result.entry_fee).toBe((18n * E18).toString());
		expect(result.protocol_fee).toBe((20n * E18).toString());
		expect(result.min_deposit).toBe((22n * E18).toString());
		expect(result.formatted_atom_cost).toBe('12');
		expect(result.formatted_triple_cost).toBe('13');
	});
});

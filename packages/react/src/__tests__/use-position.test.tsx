import { describe, expect, it, vi } from 'vitest';

const mockUseReadContracts = vi.fn();

vi.mock('wagmi', () => ({
	useReadContracts: (...args: unknown[]) => mockUseReadContracts(...args),
}));

vi.mock('../provider', () => ({
	useIntuitionConfig: () => ({
		chain: { id: 13579, name: 'Intuition Testnet' },
		chainId: 13579,
		multivaultAddress: '0xeBc49d356B7f64D888130D85CC6D17114a6843ec',
	}),
	useChainConfig: () => ({
		chainId: 13579,
		multivaultAddress: '0xeBc49d356B7f64D888130D85CC6D17114a6843ec',
	}),
}));

import { renderHook } from '@testing-library/react';
import type { Address, Hex } from 'viem';
import { usePosition, usePositions } from '../hooks/use-position';

const account = '0x1111111111111111111111111111111111111111' as Address;
const termId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;
const curveId = 1n;

describe('usePosition', () => {
	it('returns loading state while reads are pending', () => {
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: true,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => usePosition(account, termId, curveId));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('returns position data when reads succeed (non-zero shares)', () => {
		// First call: getShares, maxRedeem, convertToAssets(placeholder)
		// Second call: convertToAssets(with actual shares)
		let callCount = 0;
		mockUseReadContracts.mockImplementation(() => {
			callCount++;
			if (callCount <= 1) {
				return {
					data: [
						{ status: 'success', result: 500n }, // getShares
						{ status: 'success', result: 450n }, // maxRedeem
						{ status: 'success', result: 0n }, // convertToAssets placeholder
					],
					isLoading: false,
					isPending: false,
					isError: false,
					error: null,
					refetch: vi.fn(),
				};
			}
			// Second call for asset conversion
			return {
				data: [
					{ status: 'success', result: 1000n }, // convertToAssets(500n)
				],
				isLoading: false,
				isPending: false,
				isError: false,
				error: null,
				refetch: vi.fn(),
			};
		});

		const { result } = renderHook(() => usePosition(account, termId, curveId));

		expect(result.current.data).toBeDefined();
		expect(result.current.data?.shares).toBe(500n);
		expect(result.current.data?.maxRedeemShares).toBe(450n);
		expect(result.current.data?.account).toBe(account);
		expect(result.current.data?.termId).toBe(termId);
		expect(result.current.data?.curveId).toBe(curveId);
	});

	it('returns error state on failure', () => {
		const testError = new Error('Position read failed');
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: false,
			isError: true,
			error: testError,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => usePosition(account, termId, curveId));

		expect(result.current.isError).toBe(true);
		expect(result.current.error).toBe(testError);
	});
});

describe('usePositions', () => {
	it('returns loading state while reads are pending', () => {
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: true,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => usePositions(account, [{ termId, curveId }]));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('returns positions for multiple vaults when reads succeed', () => {
		const termId2 = '0x0000000000000000000000000000000000000000000000000000000000000002' as Hex;

		mockUseReadContracts.mockReturnValue({
			data: [
				{ status: 'success', result: 100n }, // getShares vault 1
				{ status: 'success', result: 90n }, // maxRedeem vault 1
				{ status: 'success', result: 200n }, // getShares vault 2
				{ status: 'success', result: 180n }, // maxRedeem vault 2
			],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() =>
			usePositions(account, [
				{ termId, curveId },
				{ termId: termId2, curveId },
			])
		);

		expect(result.current.data).toBeDefined();
		expect(result.current.data).toHaveLength(2);

		const positions = result.current.data!;
		expect(positions[0]!.shares).toBe(100n);
		expect(positions[0]!.maxRedeemShares).toBe(90n);
		expect(positions[1]!.shares).toBe(200n);
		expect(positions[1]!.maxRedeemShares).toBe(180n);
	});

	it('is disabled when vaults array is empty', () => {
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		renderHook(() => usePositions(account, []));

		expect(mockUseReadContracts).toHaveBeenCalledWith(
			expect.objectContaining({
				query: { enabled: false },
			})
		);
	});
});

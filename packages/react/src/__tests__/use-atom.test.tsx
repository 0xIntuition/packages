import { describe, expect, it, vi } from 'vitest';

// Mock wagmi hooks before importing the hooks under test
const mockUseReadContract = vi.fn();
const mockUseReadContracts = vi.fn();
const mockUseWriteContract = vi.fn();

vi.mock('wagmi', () => ({
	useReadContract: (...args: unknown[]) => mockUseReadContract(...args),
	useReadContracts: (...args: unknown[]) => mockUseReadContracts(...args),
	useWriteContract: (...args: unknown[]) => mockUseWriteContract(...args),
}));

// Mock the provider
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
import { useAtom, useCreateAtom } from '../hooks/use-atom';

describe('useAtom', () => {
	it('returns loading state while contract reads are pending', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: true,
			isPending: true,
			isError: false,
			error: null,
		});
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: true,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() =>
			useAtom('0x0000000000000000000000000000000000000000000000000000000000000001')
		);

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('returns parsed atom data when all reads succeed', () => {
		// Mock bonding curve config returning a default curve ID of 1n
		mockUseReadContract.mockReturnValue({
			data: [
				'0x0000000000000000000000000000000000000000', // registry
				1n, // defaultCurveId
			],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		mockUseReadContracts.mockReturnValue({
			data: [
				{ status: 'success', result: true }, // isAtom
				{ status: 'success', result: '0xabcd' }, // getAtom (atom data)
				{ status: 'success', result: [100n, 50n] }, // getVault [totalAssets, totalShares]
				{ status: 'success', result: 2000000000000000000n }, // currentSharePrice
			],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() =>
			useAtom('0x0000000000000000000000000000000000000000000000000000000000000001')
		);

		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toBeDefined();
		expect(result.current.data?.isAtom).toBe(true);
		expect(result.current.data?.totalAssets).toBe(100n);
		expect(result.current.data?.totalShares).toBe(50n);
		expect(result.current.data?.sharePrice).toBe(2000000000000000000n);
		expect(result.current.data?.curveId).toBe(1n);
	});

	it('returns error state on contract read failure', () => {
		const testError = new Error('Read failed');
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: false,
			isError: true,
			error: testError,
		});
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() =>
			useAtom('0x0000000000000000000000000000000000000000000000000000000000000001')
		);

		expect(result.current.isError).toBe(true);
		expect(result.current.error).toBe(testError);
	});
});

describe('useCreateAtom', () => {
	it('exposes isPending and error state from wagmi writeContract', () => {
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useCreateAtom());

		expect(result.current.isPending).toBe(false);
		expect(result.current.isError).toBe(false);
		expect(typeof result.current.createAtom).toBe('function');
		expect(typeof result.current.reset).toBe('function');
	});

	it('throws if data and assets arrays have different lengths', async () => {
		const mockWrite = vi.fn();
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useCreateAtom());

		await expect(
			result.current.createAtom({
				data: ['0x01', '0x02'],
				assets: [1000n],
			})
		).rejects.toThrow('data and assets arrays must have the same length');

		expect(mockWrite).not.toHaveBeenCalled();
	});

	it('calls writeContractAsync with correct args', async () => {
		const mockWrite = vi.fn().mockResolvedValue('0xtxhash');
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useCreateAtom());

		const txHash = await result.current.createAtom({
			data: ['0x01'],
			assets: [1000n],
		});

		expect(txHash).toBe('0xtxhash');
		expect(mockWrite).toHaveBeenCalledOnce();
		expect(mockWrite).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'createAtoms',
				args: [['0x01'], [1000n]],
				value: 1000n,
			})
		);
	});
});

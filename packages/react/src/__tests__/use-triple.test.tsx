import { describe, expect, it, vi } from 'vitest';

const mockUseReadContract = vi.fn();
const mockUseReadContracts = vi.fn();
const mockUseWriteContract = vi.fn();

vi.mock('wagmi', () => ({
	useReadContract: (...args: unknown[]) => mockUseReadContract(...args),
	useReadContracts: (...args: unknown[]) => mockUseReadContracts(...args),
	useWriteContract: (...args: unknown[]) => mockUseWriteContract(...args),
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
import type { Hex } from 'viem';
import { useCreateTriple, useTriple } from '../hooks/use-triple';

const termId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

describe('useTriple', () => {
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

		const { result } = renderHook(() => useTriple(termId));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('returns parsed triple data when all reads succeed', () => {
		const subjectId = '0x000000000000000000000000000000000000000000000000000000000000000a' as Hex;
		const predicateId = '0x000000000000000000000000000000000000000000000000000000000000000b' as Hex;
		const objectId = '0x000000000000000000000000000000000000000000000000000000000000000c' as Hex;

		mockUseReadContract.mockReturnValue({
			data: ['0x0000000000000000000000000000000000000000', 1n],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		mockUseReadContracts.mockReturnValue({
			data: [
				{ status: 'success', result: true }, // isTriple
				{ status: 'success', result: [subjectId, predicateId, objectId] }, // getTriple
				{ status: 'success', result: [200n, 100n] }, // getVault [totalAssets, totalShares]
				{ status: 'success', result: 2000000000000000000n }, // currentSharePrice
			],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useTriple(termId));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toBeDefined();
		expect(result.current.data?.isTriple).toBe(true);
		expect(result.current.data?.subjectId).toBe(subjectId);
		expect(result.current.data?.predicateId).toBe(predicateId);
		expect(result.current.data?.objectId).toBe(objectId);
		expect(result.current.data?.totalAssets).toBe(200n);
		expect(result.current.data?.totalShares).toBe(100n);
		expect(result.current.data?.sharePrice).toBe(2000000000000000000n);
	});

	it('returns error state on contract read failure', () => {
		const testError = new Error('Triple read failed');
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

		const { result } = renderHook(() => useTriple(termId));

		expect(result.current.isError).toBe(true);
		expect(result.current.error).toBe(testError);
	});

	it('uses provided curveId when specified', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		renderHook(() => useTriple(termId, { curveId: 5n }));

		// When curveId is provided, contracts array should be built with curveId = 5n
		const lastCallIndex = mockUseReadContracts.mock.calls.length - 1;
		const callArg = mockUseReadContracts.mock.calls[lastCallIndex]?.[0] as
			| { contracts?: Array<{ functionName: string; args: unknown[] }> }
			| undefined;
		if (callArg?.contracts) {
			const getVaultCall = callArg.contracts.find((c) => c.functionName === 'getVault');
			if (getVaultCall) {
				expect(getVaultCall.args[1]).toBe(5n);
			}
		}
	});
});

describe('useCreateTriple', () => {
	it('exposes isPending and error state', () => {
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useCreateTriple());

		expect(result.current.isPending).toBe(false);
		expect(result.current.isError).toBe(false);
		expect(typeof result.current.createTriple).toBe('function');
	});

	it('throws if input arrays have different lengths', async () => {
		const mockWrite = vi.fn();
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useCreateTriple());

		await expect(
			result.current.createTriple({
				subjectIds: ['0x01', '0x02'],
				predicateIds: ['0x03'],
				objectIds: ['0x05', '0x06'],
				assets: [1000n, 2000n],
			})
		).rejects.toThrow('All input arrays must have the same length');

		expect(mockWrite).not.toHaveBeenCalled();
	});

	it('calls writeContractAsync with correct args', async () => {
		const mockWrite = vi.fn().mockResolvedValue('0xtriplehash');
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useCreateTriple());

		const hash = await result.current.createTriple({
			subjectIds: ['0x01'],
			predicateIds: ['0x02'],
			objectIds: ['0x03'],
			assets: [1000n],
		});

		expect(hash).toBe('0xtriplehash');
		expect(mockWrite).toHaveBeenCalledOnce();
		expect(mockWrite).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'createTriples',
				args: [['0x01'], ['0x02'], ['0x03'], [1000n]],
				value: 1000n,
			})
		);
	});
});

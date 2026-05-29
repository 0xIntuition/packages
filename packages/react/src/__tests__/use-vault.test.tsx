import { describe, expect, it, vi } from 'vitest';

const mockUseReadContract = vi.fn();
const mockUseReadContracts = vi.fn();
const mockUseWriteContract = vi.fn();
const mockUseAccount = vi.fn();

vi.mock('wagmi', () => ({
	useReadContract: (...args: unknown[]) => mockUseReadContract(...args),
	useReadContracts: (...args: unknown[]) => mockUseReadContracts(...args),
	useWriteContract: (...args: unknown[]) => mockUseWriteContract(...args),
	useAccount: (...args: unknown[]) => mockUseAccount(...args),
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
import {
	useConvertToAssets,
	useConvertToShares,
	useDeposit,
	useDepositBatch,
	useDepositPreview,
	useRedeem,
	useRedeemBatch,
	useRedeemPreview,
	useVaultState,
} from '../hooks/use-vault';

const termId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;
const curveId = 1n;

describe('useVaultState', () => {
	it('returns loading state while reads are pending', () => {
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: true,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useVaultState(termId, curveId));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('returns parsed vault state when reads succeed', () => {
		mockUseReadContracts.mockReturnValue({
			data: [
				{ status: 'success', result: [500000000000000000n, 250000000000000000n] }, // getVault
				{ status: 'success', result: 2000000000000000000n }, // currentSharePrice
			],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useVaultState(termId, curveId));

		expect(result.current.data).toBeDefined();
		expect(result.current.data?.totalAssets).toBe(500000000000000000n);
		expect(result.current.data?.totalShares).toBe(250000000000000000n);
		expect(result.current.data?.sharePrice).toBe(2000000000000000000n);
	});

	it('returns error state on failure', () => {
		const testError = new Error('RPC failure');
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: false,
			isError: true,
			error: testError,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useVaultState(termId, curveId));

		expect(result.current.isError).toBe(true);
		expect(result.current.error).toBe(testError);
		expect(result.current.data).toBeUndefined();
	});

	it('respects enabled option', () => {
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		renderHook(() => useVaultState(termId, curveId, { enabled: false }));

		expect(mockUseReadContracts).toHaveBeenCalledWith(
			expect.objectContaining({
				query: { enabled: false },
			})
		);
	});
});

describe('useDepositPreview', () => {
	it('is disabled when amount is 0n', () => {
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useDepositPreview(termId, curveId, 0n));

		// Should be pending (not loading) because query is disabled
		expect(result.current.data).toBeUndefined();
	});

	it('returns deposit preview when amount > 0 and reads succeed', () => {
		mockUseReadContracts.mockReturnValue({
			data: [
				{ status: 'success', result: [100n, 95n] }, // previewDeposit [sharesOut, assetsAfterFees]
				{ status: 'success', result: 3n }, // entryFeeAmount
				{ status: 'success', result: 2n }, // protocolFeeAmount
			],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useDepositPreview(termId, curveId, 1000000000000000000n));

		expect(result.current.data).toBeDefined();
		expect(result.current.data?.sharesOut).toBe(100n);
		expect(result.current.data?.assetsAfterFees).toBe(95n);
		expect(result.current.data?.entryFee).toBe(3n);
		expect(result.current.data?.protocolFee).toBe(2n);
	});
});

describe('useRedeemPreview', () => {
	it('is disabled when shares is 0n', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useRedeemPreview(termId, curveId, 0n));

		expect(result.current.data).toBeUndefined();
	});

	it('returns redeem preview when shares > 0 and reads succeed', () => {
		// Mock previewRedeem result
		mockUseReadContract.mockReturnValue({
			data: [900n, 100n], // [assetsOut, sharesUsed]
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		// Mock fee calculations
		mockUseReadContracts.mockReturnValue({
			data: [
				{ status: 'success', result: 5n }, // exitFeeAmount
				{ status: 'success', result: 3n }, // protocolFeeAmount
			],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useRedeemPreview(termId, curveId, 100000000000000000n));

		expect(result.current.data).toBeDefined();
		expect(result.current.data?.assetsOut).toBe(900n);
		expect(result.current.data?.sharesUsed).toBe(100n);
		expect(result.current.data?.exitFee).toBe(5n);
		expect(result.current.data?.protocolFee).toBe(3n);
	});
});

describe('useDeposit', () => {
	it('exposes mutation state', () => {
		mockUseAccount.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useDeposit());

		expect(result.current.isPending).toBe(false);
		expect(typeof result.current.deposit).toBe('function');
	});

	it('calls writeContractAsync with deposit args', async () => {
		mockUseAccount.mockReturnValue({ address: '0x3333333333333333333333333333333333333333' });
		const mockWrite = vi.fn().mockResolvedValue('0xdeposittxhash');
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useDeposit());

		const hash = await result.current.deposit({
			receiver: '0x1111111111111111111111111111111111111111',
			termId,
			curveId,
			amount: 1000000000000000000n,
			minShares: 0n,
		});

		expect(hash).toBe('0xdeposittxhash');
		expect(mockWrite).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'deposit',
				value: 1000000000000000000n,
			})
		);
	});

	it('uses connected wallet address when receiver is not provided', async () => {
		const connectedAddr = '0x4444444444444444444444444444444444444444';
		mockUseAccount.mockReturnValue({ address: connectedAddr });
		const mockWrite = vi.fn().mockResolvedValue('0xtxhash');
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useDeposit());

		await result.current.deposit({
			termId,
			curveId,
			amount: 1000n,
		});

		expect(mockWrite).toHaveBeenCalledWith(
			expect.objectContaining({
				args: expect.arrayContaining([connectedAddr]),
			})
		);
	});

	it('throws when no receiver and no wallet connected', async () => {
		mockUseAccount.mockReturnValue({ address: undefined });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useDeposit());

		await expect(
			result.current.deposit({
				termId,
				curveId,
				amount: 1000n,
			})
		).rejects.toThrow('No receiver address provided and no wallet connected.');
	});
});

describe('useRedeem', () => {
	it('exposes mutation state', () => {
		mockUseAccount.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useRedeem());

		expect(result.current.isPending).toBe(false);
		expect(typeof result.current.redeem).toBe('function');
	});

	it('calls writeContractAsync with redeem args', async () => {
		mockUseAccount.mockReturnValue({ address: '0x3333333333333333333333333333333333333333' });
		const mockWrite = vi.fn().mockResolvedValue('0xredeemtxhash');
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useRedeem());

		const hash = await result.current.redeem({
			receiver: '0x2222222222222222222222222222222222222222',
			termId,
			curveId,
			shares: 50000000000000000n,
			minAssets: 0n,
		});

		expect(hash).toBe('0xredeemtxhash');
		expect(mockWrite).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'redeem',
			})
		);
	});

	it('throws when no receiver and no wallet connected', async () => {
		mockUseAccount.mockReturnValue({ address: undefined });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useRedeem());

		await expect(
			result.current.redeem({
				termId,
				curveId,
				shares: 100n,
			})
		).rejects.toThrow('No receiver address provided and no wallet connected.');
	});
});

describe('useDepositBatch', () => {
	it('exposes mutation state', () => {
		mockUseAccount.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useDepositBatch());

		expect(result.current.isPending).toBe(false);
		expect(typeof result.current.depositBatch).toBe('function');
	});

	it('calls writeContractAsync with correct batch args and total value', async () => {
		const connectedAddr = '0x5555555555555555555555555555555555555555';
		mockUseAccount.mockReturnValue({ address: connectedAddr });
		const mockWrite = vi.fn().mockResolvedValue('0xbatchhash');
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useDepositBatch());

		const termId2 = '0x0000000000000000000000000000000000000000000000000000000000000002' as Hex;
		await result.current.depositBatch({
			termIds: [termId, termId2],
			curveIds: [1n, 1n],
			assets: [1000n, 2000n],
		});

		expect(mockWrite).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'depositBatch',
				value: 3000n,
			})
		);
	});

	it('throws if arrays have different lengths', async () => {
		mockUseAccount.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useDepositBatch());

		await expect(
			result.current.depositBatch({
				termIds: [termId],
				curveIds: [1n, 2n],
				assets: [1000n],
			})
		).rejects.toThrow('All input arrays must have the same length.');
	});
});

describe('useRedeemBatch', () => {
	it('exposes mutation state', () => {
		mockUseAccount.mockReturnValue({ address: '0x1111111111111111111111111111111111111111' });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useRedeemBatch());

		expect(result.current.isPending).toBe(false);
		expect(typeof result.current.redeemBatch).toBe('function');
	});

	it('calls writeContractAsync with correct batch args', async () => {
		const connectedAddr = '0x6666666666666666666666666666666666666666';
		mockUseAccount.mockReturnValue({ address: connectedAddr });
		const mockWrite = vi.fn().mockResolvedValue('0xredeembatchhash');
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: mockWrite,
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});

		const { result } = renderHook(() => useRedeemBatch());

		await result.current.redeemBatch({
			termIds: [termId],
			curveIds: [1n],
			shares: [100n],
		});

		expect(mockWrite).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'redeemBatch',
			})
		);
	});
});

describe('useConvertToAssets', () => {
	it('calls useReadContract with convertToAssets', () => {
		mockUseReadContract.mockReturnValue({
			data: 500n,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useConvertToAssets(termId, curveId, 100n));

		expect(result.current.data).toBe(500n);
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'convertToAssets',
				args: [termId, curveId, 100n],
			})
		);
	});
});

describe('useConvertToShares', () => {
	it('calls useReadContract with convertToShares', () => {
		mockUseReadContract.mockReturnValue({
			data: 20n,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useConvertToShares(termId, curveId, 500n));

		expect(result.current.data).toBe(20n);
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'convertToShares',
				args: [termId, curveId, 500n],
			})
		);
	});
});

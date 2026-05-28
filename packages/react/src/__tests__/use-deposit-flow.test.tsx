import { describe, expect, it, vi } from 'vitest';

const mockUseWriteContract = vi.fn();
const mockUseAccount = vi.fn();
const mockUseWaitForTransactionReceipt = vi.fn();

vi.mock('wagmi', () => ({
	useWriteContract: (...args: unknown[]) => mockUseWriteContract(...args),
	useAccount: (...args: unknown[]) => mockUseAccount(...args),
	useWaitForTransactionReceipt: (...args: unknown[]) => mockUseWaitForTransactionReceipt(...args),
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

import { act, renderHook } from '@testing-library/react';
import type { Hex } from 'viem';
import { useDepositFlow } from '../hooks/use-deposit-flow';

const termId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;
const curveId = 1n;

describe('useDepositFlow', () => {
	it('starts in idle state', () => {
		mockUseAccount.mockReturnValue({
			address: '0x1111111111111111111111111111111111111111',
		});
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const { result } = renderHook(() => useDepositFlow());

		expect(result.current.status).toBe('idle');
		expect(result.current.hash).toBeUndefined();
		expect(result.current.receipt).toBeUndefined();
		expect(result.current.error).toBeUndefined();
		expect(typeof result.current.deposit).toBe('function');
		expect(typeof result.current.reset).toBe('function');
	});

	it('calls onError when deposit fails', async () => {
		const submitError = new Error('User rejected');
		mockUseAccount.mockReturnValue({
			address: '0x1111111111111111111111111111111111111111',
		});
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn().mockRejectedValue(submitError),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const onError = vi.fn();
		const { result } = renderHook(() => useDepositFlow({ onError }));

		let caughtError: Error | undefined;
		await act(async () => {
			try {
				await result.current.deposit({
					termId,
					curveId,
					amount: 1000n,
				});
			} catch (err) {
				caughtError = err as Error;
			}
		});

		expect(caughtError).toBe(submitError);
		expect(result.current.status).toBe('error');
		expect(result.current.error).toBe(submitError);
		expect(onError).toHaveBeenCalledWith(submitError);
	});

	it('transitions to confirming after successful submission', async () => {
		const txHash = '0xdeposithash123' as Hex;
		mockUseAccount.mockReturnValue({
			address: '0x1111111111111111111111111111111111111111',
		});
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn().mockResolvedValue(txHash),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const { result } = renderHook(() => useDepositFlow());

		act(() => {
			result.current
				.deposit({
					termId,
					curveId,
					amount: 1000000000000000000n,
				})
				.catch(() => {});
		});

		await vi.waitFor(() => {
			expect(result.current.status).toBe('confirming');
			expect(result.current.hash).toBe(txHash);
		});
	});

	it('resets to idle state', () => {
		mockUseAccount.mockReturnValue({
			address: '0x1111111111111111111111111111111111111111',
		});
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn(),
			isPending: false,
			isError: false,
			error: null,
			data: undefined,
			reset: vi.fn(),
		});
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const { result } = renderHook(() => useDepositFlow());

		act(() => {
			result.current.reset();
		});

		expect(result.current.status).toBe('idle');
		expect(result.current.hash).toBeUndefined();
		expect(result.current.error).toBeUndefined();
	});
});

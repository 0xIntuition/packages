import { describe, expect, it, vi } from 'vitest';

const mockUseWaitForTransactionReceipt = vi.fn();

vi.mock('wagmi', () => ({
	useWaitForTransactionReceipt: (...args: unknown[]) => mockUseWaitForTransactionReceipt(...args),
}));

import { act, renderHook } from '@testing-library/react';
import type { Hex, TransactionReceipt } from 'viem';
import { useTransactionFlow } from '../hooks/use-transaction-flow';

const mockReceipt: TransactionReceipt = {
	blockHash: '0xblockhash' as Hex,
	blockNumber: 1n,
	contractAddress: null,
	cumulativeGasUsed: 21000n,
	effectiveGasPrice: 1000000000n,
	from: '0x1111111111111111111111111111111111111111',
	gasUsed: 21000n,
	logs: [],
	logsBloom: '0x0' as Hex,
	status: 'success',
	to: '0x2222222222222222222222222222222222222222',
	transactionHash: '0xtxhash' as Hex,
	transactionIndex: 0,
	type: 'legacy',
};

describe('useTransactionFlow', () => {
	it('starts in idle state', () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const mutationFn = vi.fn();
		const { result } = renderHook(() => useTransactionFlow({ mutationFn }));

		expect(result.current.status).toBe('idle');
		expect(result.current.hash).toBeUndefined();
		expect(result.current.receipt).toBeUndefined();
		expect(result.current.error).toBeUndefined();
		expect(typeof result.current.execute).toBe('function');
		expect(typeof result.current.reset).toBe('function');
	});

	it('transitions to submitting when execute is called', async () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const mutationFn = vi.fn().mockImplementation(
			() => new Promise(() => {}) // never resolves
		);

		const { result } = renderHook(() => useTransactionFlow({ mutationFn }));

		// Start execution (don't await - it won't resolve)
		act(() => {
			result.current.execute({ amount: 1000n }).catch(() => {});
		});

		// The mutation is in-flight
		expect(mutationFn).toHaveBeenCalledWith({ amount: 1000n });
	});

	it('transitions to error when mutation fails', async () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const submitError = new Error('User rejected transaction');
		const mutationFn = vi.fn().mockRejectedValue(submitError);
		const onError = vi.fn();

		const { result } = renderHook(() => useTransactionFlow({ mutationFn, onError }));

		let caughtError: Error | undefined;
		await act(async () => {
			try {
				await result.current.execute({ amount: 1000n });
			} catch (err) {
				caughtError = err as Error;
			}
		});

		expect(caughtError).toBe(submitError);
		expect(result.current.status).toBe('error');
		expect(result.current.error).toBe(submitError);
		expect(onError).toHaveBeenCalledWith(submitError);
	});

	it('transitions to confirming after mutation succeeds', async () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const txHash = '0xabcdef1234567890' as Hex;
		const mutationFn = vi.fn().mockResolvedValue(txHash);

		const { result } = renderHook(() => useTransactionFlow({ mutationFn }));

		// Execute but don't wait for full flow (receipt won't come in test)
		act(() => {
			result.current.execute({ amount: 1000n }).catch(() => {});
		});

		// After mutation resolves, should be in confirming with hash
		await vi.waitFor(() => {
			expect(result.current.hash).toBe(txHash);
			expect(result.current.status).toBe('confirming');
		});
	});

	it('resets to idle state', () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const mutationFn = vi.fn();
		const { result } = renderHook(() => useTransactionFlow({ mutationFn }));

		act(() => {
			result.current.reset();
		});

		expect(result.current.status).toBe('idle');
		expect(result.current.hash).toBeUndefined();
		expect(result.current.receipt).toBeUndefined();
		expect(result.current.error).toBeUndefined();
	});

	it('passes confirmations to useWaitForTransactionReceipt', () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({
			data: undefined,
			error: undefined,
		});

		const mutationFn = vi.fn();
		renderHook(() => useTransactionFlow({ mutationFn, confirmations: 3 }));

		expect(mockUseWaitForTransactionReceipt).toHaveBeenCalledWith(
			expect.objectContaining({
				confirmations: 3,
			})
		);
	});
	it.each([
		'success',
		'reverted',
	] as const)('settles a %s receipt and calls the matching callback', async (status) => {
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: undefined, error: undefined });
		const onConfirmed = vi.fn();
		const onError = vi.fn();
		const { result, rerender } = renderHook(() =>
			useTransactionFlow({
				mutationFn: async () => mockReceipt.transactionHash,
				onConfirmed,
				onError,
			})
		);
		let completion!: Promise<TransactionReceipt | Error>;
		await act(async () => {
			completion = result.current.execute({}).catch((error) => error);
		});
		const receipt = { ...mockReceipt, status };
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: receipt, error: undefined });
		act(() => rerender());
		const settled = await completion;
		if (status === 'success') {
			expect(settled).toEqual(receipt);
			expect(result.current.status).toBe('confirmed');
			expect(onConfirmed).toHaveBeenCalledExactlyOnceWith(receipt);
			expect(onError).not.toHaveBeenCalled();
		} else {
			expect(settled).toEqual(new Error('Transaction reverted.'));
			expect(result.current.status).toBe('error');
			expect(onConfirmed).not.toHaveBeenCalled();
			expect(onError).toHaveBeenCalledTimes(1);
		}
	});

	it('rejects overlapping calls without replacing the first promise', async () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: undefined, error: undefined });
		const mutationFn = vi.fn(async () => mockReceipt.transactionHash);
		const { result, rerender } = renderHook(() => useTransactionFlow({ mutationFn }));
		let first!: Promise<TransactionReceipt>;
		let second!: Promise<unknown>;
		await act(async () => {
			first = result.current.execute({});
			second = result.current.execute({}).catch((error) => error);
		});
		expect(await second).toEqual(new Error('A transaction is already in progress.'));
		expect(mutationFn).toHaveBeenCalledTimes(1);
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: mockReceipt, error: undefined });
		act(() => rerender());
		expect(await first).toEqual(mockReceipt);
	});

	it('reset rejects an in-flight wallet request and ignores its late response', async () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: undefined, error: undefined });
		let submit!: (hash: Hex) => void;
		const mutationFn = () =>
			new Promise<Hex>((resolve) => {
				submit = resolve;
			});
		const { result } = renderHook(() => useTransactionFlow({ mutationFn }));
		let completion!: Promise<unknown>;
		act(() => {
			completion = result.current.execute({}).catch((error) => error);
		});
		act(() => result.current.reset());
		expect(await completion).toEqual(new Error('Transaction flow reset.'));
		await act(async () => {
			submit(mockReceipt.transactionHash);
		});
		expect(result.current.status).toBe('idle');
		expect(result.current.hash).toBeUndefined();
	});

	it('unmount rejects an awaiting confirmation', async () => {
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: undefined, error: undefined });
		const { result, unmount } = renderHook(() =>
			useTransactionFlow({ mutationFn: async () => mockReceipt.transactionHash })
		);
		let completion!: Promise<unknown>;
		await act(async () => {
			completion = result.current.execute({}).catch((error) => error);
		});
		unmount();
		expect(await completion).toEqual(new Error('Transaction flow unmounted.'));
	});
});

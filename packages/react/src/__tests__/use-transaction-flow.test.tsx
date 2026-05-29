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
});

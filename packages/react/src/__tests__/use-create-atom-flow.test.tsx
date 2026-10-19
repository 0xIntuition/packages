import { describe, expect, it, vi } from 'vitest';

const mockUseReadContract = vi.fn();
const mockUseWriteContract = vi.fn();
const mockUseWaitForTransactionReceipt = vi.fn();

vi.mock('wagmi', () => ({
	useReadContract: (...args: unknown[]) => mockUseReadContract(...args),
	useWriteContract: (...args: unknown[]) => mockUseWriteContract(...args),
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

import { MultiVaultAbi } from '@0xintuition/protocol';
import { act, renderHook } from '@testing-library/react';
import {
	type Address,
	encodeAbiParameters,
	encodeEventTopics,
	type Hex,
	type TransactionReceipt,
} from 'viem';
import { useCreateAtomFlow } from '../hooks/use-create-atom-flow';

describe('useCreateAtomFlow', () => {
	it('starts in idle state with atomCost', () => {
		mockUseReadContract.mockReturnValue({
			data: 1000000000000000n, // 0.001 ETH atom cost
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
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

		const { result } = renderHook(() => useCreateAtomFlow());

		expect(result.current.status).toBe('idle');
		expect(result.current.atomCost).toBe(1000000000000000n);
		expect(typeof result.current.createAtom).toBe('function');
		expect(typeof result.current.reset).toBe('function');
	});

	it('exposes undefined atomCost when loading', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: true,
			isPending: true,
			isError: false,
			error: null,
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

		const { result } = renderHook(() => useCreateAtomFlow());

		expect(result.current.atomCost).toBeUndefined();
	});

	it('calls onError when creation fails', async () => {
		const submitError = new Error('Insufficient funds');
		mockUseReadContract.mockReturnValue({
			data: 1000000000000000n,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
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
		const { result } = renderHook(() => useCreateAtomFlow({ onError }));

		let caughtError: Error | undefined;
		await act(async () => {
			try {
				await result.current.createAtom({
					data: ['0x68656c6c6f'],
					assets: [1000000000000000n],
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
		const txHash = '0xcreateatomhash' as Hex;
		mockUseReadContract.mockReturnValue({
			data: 1000000000000000n,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
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

		const { result } = renderHook(() => useCreateAtomFlow());

		act(() => {
			result.current
				.createAtom({
					data: ['0x68656c6c6f'],
					assets: [1000000000000000n],
				})
				.catch(() => {});
		});

		await vi.waitFor(() => {
			expect(result.current.status).toBe('confirming');
			expect(result.current.hash).toBe(txHash);
		});
	});

	it('resets to idle state', () => {
		mockUseReadContract.mockReturnValue({
			data: 1000000000000000n,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
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

		const { result } = renderHook(() => useCreateAtomFlow());

		act(() => {
			result.current.reset();
		});

		expect(result.current.status).toBe('idle');
		expect(result.current.hash).toBeUndefined();
		expect(result.current.error).toBeUndefined();
	});
	it('returns and reports only atoms emitted by the configured MultiVault', async () => {
		const vault = '0xeBc49d356B7f64D888130D85CC6D17114a6843ec' as Address;
		const foreign = '0x1111111111111111111111111111111111111111' as Address;
		const termId = `0x${'aa'.repeat(32)}` as Hex;
		const foreignTerm = `0x${'bb'.repeat(32)}` as Hex;
		const hash = `0x${'cc'.repeat(32)}` as Hex;
		const log = (address: Address, id: Hex) => ({
			address,
			topics: encodeEventTopics({
				abi: MultiVaultAbi,
				eventName: 'AtomCreated',
				args: { creator: foreign, termId: id },
			}),
			data: encodeAbiParameters([{ type: 'bytes' }, { type: 'address' }], ['0x01', foreign]),
		});
		const receipt = {
			status: 'success',
			transactionHash: hash,
			logs: [log(foreign, foreignTerm), log(vault, termId)],
		} as TransactionReceipt;
		mockUseReadContract.mockReturnValue({ data: 1n });
		mockUseWriteContract.mockReturnValue({
			writeContractAsync: vi.fn().mockResolvedValue(hash),
			reset: vi.fn(),
		});
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: undefined, error: undefined });
		const onConfirmed = vi.fn();
		const { result, rerender } = renderHook(() => useCreateAtomFlow({ onConfirmed }));
		let completion!: ReturnType<typeof result.current.createAtom>;
		await act(async () => {
			completion = result.current.createAtom({ data: ['0x01'], assets: [1n] });
		});
		mockUseWaitForTransactionReceipt.mockReturnValue({ data: receipt, error: undefined });
		act(() => rerender());
		expect((await completion).termIds).toEqual([termId]);
		expect(onConfirmed).toHaveBeenCalledExactlyOnceWith(receipt, termId);
	});
});

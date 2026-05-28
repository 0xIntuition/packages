import { describe, expect, it, vi } from 'vitest';

const mockUseReadContract = vi.fn();
const mockUseReadContracts = vi.fn();

vi.mock('wagmi', () => ({
	useReadContract: (...args: unknown[]) => mockUseReadContract(...args),
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

// Mock calculateAtomId from ids
vi.mock('@0xintuition/ids', () => ({
	calculateAtomId: (_data: string) =>
		'0x0000000000000000000000000000000000000000000000000000000000000abc',
}));

import { renderHook } from '@testing-library/react';
import type { Address } from 'viem';
import { useAtomState } from '../hooks/use-atom-state';

describe('useAtomState', () => {
	it('returns undefined termId when atomData is empty', () => {
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
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useAtomState(''));

		expect(result.current.termId).toBeUndefined();
		expect(result.current.isAtom).toBeUndefined();
		expect(result.current.vault).toBeUndefined();
	});

	it('returns undefined termId when atomData is undefined', () => {
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
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useAtomState(undefined));

		expect(result.current.termId).toBeUndefined();
	});

	it('computes termId from raw atom data string', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isPending: true,
			isLoading: true,
			isError: false,
			error: null,
		});
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isPending: true,
			isLoading: true,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useAtomState('hello-world'));

		expect(result.current.termId).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000abc'
		);
		expect(result.current.isPending).toBe(true);
	});

	it('returns full atom state when all reads succeed', () => {
		// Mock bonding curve config
		mockUseReadContract.mockReturnValue({
			data: ['0x0000000000000000000000000000000000000000', 1n],
			isPending: false,
			isLoading: false,
			isError: false,
			error: null,
		});

		// Mock core reads + position reads + asset conversion
		// useReadContracts is called 3 times: core, position, asset conversion
		let callCount = 0;
		mockUseReadContracts.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				// Core results: isAtom, getVault, currentSharePrice
				return {
					data: [
						{ status: 'success', result: true },
						{ status: 'success', result: [500n, 200n] },
						{ status: 'success', result: 2500000000000000000n },
					],
					isPending: false,
					isLoading: false,
					isError: false,
					error: null,
				};
			}
			if (callCount === 2) {
				// Position results: getShares, maxRedeem
				return {
					data: [
						{ status: 'success', result: 100n },
						{ status: 'success', result: 80n },
					],
					isPending: false,
					isLoading: false,
					isError: false,
					error: null,
				};
			}
			// Asset conversion: convertToAssets
			return {
				data: [{ status: 'success', result: 250n }],
				isPending: false,
				isLoading: false,
				isError: false,
				error: null,
			};
		});

		const account = '0x1111111111111111111111111111111111111111' as Address;
		const { result } = renderHook(() => useAtomState('hello-world', { account }));

		expect(result.current.termId).toBeDefined();
		expect(result.current.isAtom).toBe(true);
		expect(result.current.vault).toBeDefined();
		expect(result.current.vault?.totalAssets).toBe(500n);
		expect(result.current.vault?.totalShares).toBe(200n);
		expect(result.current.vault?.sharePrice).toBe(2500000000000000000n);
		expect(result.current.position).toBeDefined();
		expect(result.current.position?.shares).toBe(100n);
		expect(result.current.position?.maxRedeem).toBe(80n);

		// Reset call count
		callCount = 0;
	});

	it('returns no position when account is not provided', () => {
		mockUseReadContract.mockReturnValue({
			data: ['0x0000000000000000000000000000000000000000', 1n],
			isPending: false,
			isLoading: false,
			isError: false,
			error: null,
		});

		mockUseReadContracts.mockReturnValue({
			data: [
				{ status: 'success', result: false },
				{ status: 'success', result: [0n, 0n] },
				{ status: 'success', result: 0n },
			],
			isPending: false,
			isLoading: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useAtomState('some-data'));

		expect(result.current.position).toBeUndefined();
	});

	it('reports error when reads fail', () => {
		const testError = new Error('RPC failure');
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isPending: false,
			isLoading: false,
			isError: true,
			error: testError,
		});
		mockUseReadContracts.mockReturnValue({
			data: undefined,
			isPending: false,
			isLoading: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useAtomState('failing-data'));

		expect(result.current.error).toBe(testError);
	});
});

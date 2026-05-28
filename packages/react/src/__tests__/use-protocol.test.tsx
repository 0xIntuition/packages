import { describe, expect, it, vi } from 'vitest';

const mockUseReadContract = vi.fn();

vi.mock('wagmi', () => ({
	useReadContract: (...args: unknown[]) => mockUseReadContract(...args),
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
	useAtomConfig,
	useAtomCost,
	useBondingCurveConfig,
	useCounterTripleId,
	useGeneralConfig,
	useIsTermCreated,
	usePreviewAtomCreate,
	usePreviewTripleCreate,
	useProtocolFees,
	useTripleConfig,
	useTripleCost,
	useWalletConfig,
} from '../hooks/use-protocol';

describe('useProtocolFees', () => {
	it('reads getVaultFees from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: { entryFee: 100n, exitFee: 200n, protocolFee: 50n },
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useProtocolFees());

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getVaultFees',
			})
		);
		// The raw data is the struct; the select transform would be applied by TanStack Query
		expect(result.current.data).toBeDefined();
	});
});

describe('useAtomCost', () => {
	it('reads getAtomCost from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: 1000000000000000n,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useAtomCost());

		expect(result.current.data).toBe(1000000000000000n);
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getAtomCost',
			})
		);
	});
});

describe('useTripleCost', () => {
	it('reads getTripleCost from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: 2000000000000000n,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useTripleCost());

		expect(result.current.data).toBe(2000000000000000n);
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getTripleCost',
			})
		);
	});
});

describe('useGeneralConfig', () => {
	it('reads getGeneralConfig from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: { admin: '0x1234' },
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useGeneralConfig());

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getGeneralConfig',
			})
		);
		expect(result.current.data).toBeDefined();
	});
});

describe('useBondingCurveConfig', () => {
	it('reads getBondingCurveConfig from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: { registry: '0xabcd', defaultCurveId: 1n },
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useBondingCurveConfig());

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getBondingCurveConfig',
			})
		);
		expect(result.current.data).toBeDefined();
	});
});

describe('useAtomConfig', () => {
	it('reads getAtomConfig from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: { atomCreationProtocolFee: 500n, atomWalletDepositFee: 100n },
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useAtomConfig());

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getAtomConfig',
			})
		);
		expect(result.current.data).toBeDefined();
	});
});

describe('useTripleConfig', () => {
	it('reads getTripleConfig from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: { tripleCreationProtocolFee: 300n, atomDepositFractionForTriple: 100n },
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useTripleConfig());

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getTripleConfig',
			})
		);
		expect(result.current.data).toBeDefined();
	});
});

describe('useWalletConfig', () => {
	it('reads getWalletConfig from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: { entryPoint: '0xabc' },
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useWalletConfig());

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getWalletConfig',
			})
		);
		expect(result.current.data).toBeDefined();
	});
});

describe('useIsTermCreated', () => {
	const termId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

	it('reads isTermCreated for a given term ID', () => {
		mockUseReadContract.mockReturnValue({
			data: true,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useIsTermCreated(termId));

		expect(result.current.data).toBe(true);
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'isTermCreated',
				args: [termId],
			})
		);
	});

	it('is disabled when termId is undefined', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
		});

		renderHook(() => useIsTermCreated(undefined));

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				query: { enabled: false },
			})
		);
	});
});

describe('useCounterTripleId', () => {
	const tripleId = '0x0000000000000000000000000000000000000000000000000000000000000042' as Hex;

	it('reads getCounterIdFromTripleId from the contract', () => {
		const counterId = '0x0000000000000000000000000000000000000000000000000000000000000099' as Hex;
		mockUseReadContract.mockReturnValue({
			data: counterId,
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => useCounterTripleId(tripleId));

		expect(result.current.data).toBe(counterId);
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'getCounterIdFromTripleId',
				args: [tripleId],
			})
		);
	});

	it('is disabled when tripleId is undefined', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
		});

		renderHook(() => useCounterTripleId(undefined));

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				query: { enabled: false },
			})
		);
	});
});

describe('usePreviewAtomCreate', () => {
	const termId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

	it('reads previewAtomCreate from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: [50n, 45n],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => usePreviewAtomCreate(termId, 1000n));

		expect(result.current.data).toBeDefined();
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'previewAtomCreate',
				args: [termId, 1000n],
			})
		);
	});

	it('is disabled when termId is undefined', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
		});

		renderHook(() => usePreviewAtomCreate(undefined, 1000n));

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				query: { enabled: false },
			})
		);
	});

	it('is disabled when assets is 0n', () => {
		mockUseReadContract.mockReturnValue({
			data: undefined,
			isLoading: false,
			isPending: true,
			isError: false,
			error: null,
		});

		renderHook(() => usePreviewAtomCreate(termId, 0n));

		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				query: { enabled: false },
			})
		);
	});
});

describe('usePreviewTripleCreate', () => {
	const termId = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

	it('reads previewTripleCreate from the contract', () => {
		mockUseReadContract.mockReturnValue({
			data: [30n, 25n],
			isLoading: false,
			isPending: false,
			isError: false,
			error: null,
		});

		const { result } = renderHook(() => usePreviewTripleCreate(termId, 2000n));

		expect(result.current.data).toBeDefined();
		expect(mockUseReadContract).toHaveBeenCalledWith(
			expect.objectContaining({
				functionName: 'previewTripleCreate',
				args: [termId, 2000n],
			})
		);
	});
});

import type { Address, Hex, PublicClient } from 'viem';
import { zeroAddress } from 'viem';
import { base } from 'viem/chains';
import { describe, expect, it, vi } from 'vitest';

import { trustSwapAndBridgeRouterFindBestRoute } from './find-best-route';

const TRUST = '0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3' as Address;
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;

describe('trustSwapAndBridgeRouterFindBestRoute', () => {
	it('throws when chain is not Base', async () => {
		const publicClient = {
			chain: { id: 1 },
		} as unknown as PublicClient;

		await expect(
			trustSwapAndBridgeRouterFindBestRoute(
				{ publicClient },
				{ tokenIn: USDC, amountIn: 1_000_000n }
			)
		).rejects.toThrow('Base-only');
	});

	it('throws when tokenIn is TRUST', async () => {
		const publicClient = {
			chain: base,
		} as unknown as PublicClient;

		await expect(
			trustSwapAndBridgeRouterFindBestRoute(
				{ publicClient },
				{ tokenIn: TRUST, amountIn: 1_000_000n }
			)
		).rejects.toThrow('already TRUST');
	});

	it('returns the highest quoted direct USDC->TRUST route', async () => {
		const poolOne = '0x0000000000000000000000000000000000000001' as Address;
		const poolTwo = '0x0000000000000000000000000000000000000002' as Address;

		const readContract = vi.fn().mockImplementation(({ args }) => {
			const [tokenA, tokenB, tickSpacing] = args as [Address, Address, number];
			const pairKey = `${tokenA.toLowerCase()}-${tokenB.toLowerCase()}`;
			const isUsdcTrustPair =
				pairKey === `${USDC.toLowerCase()}-${TRUST.toLowerCase()}` ||
				pairKey === `${TRUST.toLowerCase()}-${USDC.toLowerCase()}`;

			if (!isUsdcTrustPair) {
				return zeroAddress;
			}

			if (tickSpacing === 1) {
				return poolOne;
			}
			if (tickSpacing === 100) {
				return poolTwo;
			}

			return zeroAddress;
		});

		const simulateContract = vi.fn().mockImplementation(({ args }) => {
			const [path] = args as [Hex, bigint];
			if (path.includes('000064')) {
				return { result: [200n, [], [], 0n] as const };
			}
			return { result: [100n, [], [], 0n] as const };
		});

		const publicClient = {
			chain: base,
			readContract,
			simulateContract,
		} as unknown as PublicClient;

		const bestRoute = await trustSwapAndBridgeRouterFindBestRoute(
			{ publicClient },
			{ tokenIn: USDC, amountIn: 1_000_000n }
		);

		expect(bestRoute.quote).toBe(200n);
		expect(bestRoute.tokens).toEqual([USDC, TRUST]);
		expect(bestRoute.tickSpacings).toEqual([100]);
		expect(simulateContract).toHaveBeenCalledTimes(2);
	});

	it('throws when no viable routes are found', async () => {
		const readContract = vi.fn().mockReturnValue(zeroAddress);
		const simulateContract = vi.fn();
		const publicClient = {
			chain: base,
			readContract,
			simulateContract,
		} as unknown as PublicClient;

		await expect(
			trustSwapAndBridgeRouterFindBestRoute(
				{ publicClient },
				{ tokenIn: USDC, amountIn: 1_000_000n }
			)
		).rejects.toThrow('No viable Slipstream route found');
		expect(simulateContract).not.toHaveBeenCalled();
	});
});

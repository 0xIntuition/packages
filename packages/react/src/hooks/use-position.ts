'use client';

import { MultiVaultAbi } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { useReadContracts } from 'wagmi';

import { useChainConfig } from '../provider';
import type { PositionData } from '../types';

type PositionQueryResult<T> = {
	data: T | undefined;
	isLoading: boolean;
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => unknown | Promise<unknown>;
};

/**
 * Reads a user's position in a specific vault: shares held, max redeemable,
 * and estimated asset value.
 *
 * @param account - The wallet address to query.
 * @param termId - The term ID (atom or triple) of the vault.
 * @param curveId - The bonding curve ID.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled. Defaults to `true`.
 *
 * @example
 * ```tsx
 * const { data: position, isLoading } = usePosition(address, termId, curveId)
 * if (position) {
 *   console.log('Shares:', position.shares)
 *   console.log('Max redeem:', position.maxRedeemShares)
 *   console.log('Value:', formatEther(position.estimatedAssets))
 * }
 * ```
 */
export function usePosition(
	account: Address,
	termId: Hex,
	curveId: bigint,
	options?: { chainId?: number; enabled?: boolean }
): PositionQueryResult<PositionData> {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false;

	const results = useReadContracts({
		contracts: [
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'getShares',
				args: [account, termId, curveId],
				chainId,
			},
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'maxRedeem',
				args: [account, termId, curveId],
				chainId,
			},
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'convertToAssets',
				args: [termId, curveId, 0n], // placeholder, replaced below
				chainId,
			},
		] as const,
		query: { enabled },
	});

	// After the first batch, we know the user's shares.
	// We need a second call to convert those shares to assets.
	const userShares =
		results.data?.[0]?.status === 'success' ? (results.data[0].result as bigint) : undefined;

	const assetConversion = useReadContracts({
		contracts:
			userShares !== undefined
				? [
						{
							address: multivaultAddress,
							abi: MultiVaultAbi,
							functionName: 'convertToAssets',
							args: [termId, curveId, userShares],
							chainId,
						},
					]
				: undefined,
		query: { enabled: enabled && userShares !== undefined && userShares > 0n },
	});

	const data =
		results.data && results.data[0]?.status === 'success' && results.data[1]?.status === 'success'
			? (() => {
					const shares = results.data[0].result as bigint;
					const maxRedeemShares = results.data[1].result as bigint;
					const estimatedAssets =
						shares > 0n && assetConversion.data?.[0]?.status === 'success'
							? (assetConversion.data[0].result as bigint)
							: 0n;

					return {
						account,
						termId,
						curveId,
						shares,
						maxRedeemShares,
						estimatedAssets,
					} satisfies PositionData;
				})()
			: undefined;

	return {
		data,
		isLoading: results.isLoading || assetConversion.isLoading,
		isPending: results.isPending || assetConversion.isPending,
		isError: results.isError || assetConversion.isError,
		error: results.error ?? assetConversion.error,
		refetch: async () => {
			await results.refetch();
			await assetConversion.refetch();
		},
	};
}

/**
 * Reads positions for a user across multiple vaults in a single batched call.
 *
 * @param account - The wallet address to query.
 * @param vaults - Array of `{ termId, curveId }` pairs identifying each vault.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled. Defaults to `true`.
 *
 * @example
 * ```tsx
 * const { data: positions } = usePositions(address, [
 *   { termId: atomTermId, curveId: 1n },
 *   { termId: tripleTermId, curveId: 1n },
 * ])
 * positions?.forEach(p => console.log(p.termId, p.shares))
 * ```
 */
export function usePositions(
	account: Address,
	vaults: ReadonlyArray<{ termId: Hex; curveId: bigint }>,
	options?: { chainId?: number; enabled?: boolean }
): PositionQueryResult<PositionData[]> {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false && vaults.length > 0;

	const contracts = vaults.flatMap((vault) => [
		{
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'getShares' as const,
			args: [account, vault.termId, vault.curveId] as const,
			chainId,
		},
		{
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'maxRedeem' as const,
			args: [account, vault.termId, vault.curveId] as const,
			chainId,
		},
	]);

	const results = useReadContracts({
		contracts,
		query: { enabled },
	});

	const data = results.data?.every((r) => r.status === 'success')
		? vaults.map((vault, i) => {
				const sharesResult = results.data[i * 2];
				const maxRedeemResult = results.data[i * 2 + 1];

				return {
					account,
					termId: vault.termId,
					curveId: vault.curveId,
					shares: (sharesResult?.result as bigint) ?? 0n,
					maxRedeemShares: (maxRedeemResult?.result as bigint) ?? 0n,
					estimatedAssets: 0n, // requires separate convertToAssets calls
				} satisfies PositionData;
			})
		: undefined;

	return {
		data,
		isLoading: results.isLoading,
		isPending: results.isPending,
		isError: results.isError,
		error: results.error,
		refetch: results.refetch,
	};
}

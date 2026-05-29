'use client';

import { MultiVaultAbi, multiVaultResolveVaultTotals } from '@0xintuition/protocol';
import type { Hex } from 'viem';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';

import { useChainConfig } from '../provider';
import type { DepositPreview, RedeemPreview, VaultState } from '../types';

type VaultQueryResult<T> = {
	data: T | undefined;
	isLoading: boolean;
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => unknown | Promise<unknown>;
};

type DepositInput = {
	receiver?: `0x${string}`;
	termId: Hex;
	curveId: bigint;
	amount: bigint;
	minShares?: bigint;
};

type RedeemInput = {
	receiver?: `0x${string}`;
	termId: Hex;
	curveId: bigint;
	shares: bigint;
	minAssets?: bigint;
};

type DepositBatchInput = {
	receiver?: `0x${string}`;
	termIds: Hex[];
	curveIds: bigint[];
	assets: bigint[];
	minShares?: bigint[];
};

type RedeemBatchInput = {
	receiver?: `0x${string}`;
	termIds: Hex[];
	curveIds: bigint[];
	shares: bigint[];
	minAssets?: bigint[];
};

type VaultMutationResult<Name extends string, Input> = {
	[K in Name]: (inputs: Input) => Promise<Hex>;
} & {
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	data: Hex | undefined;
	reset: () => void;
};

/**
 * Reads the current vault state: total assets, total shares, and share price.
 *
 * @param termId - The term ID (atom or triple) identifying the vault.
 * @param curveId - The bonding curve ID for the vault.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled. Defaults to `true`.
 *
 * @example
 * ```tsx
 * const { data: vault, isLoading } = useVaultState(termId, curveId)
 * if (vault) {
 *   console.log(formatEther(vault.totalAssets), vault.sharePrice)
 * }
 * ```
 */
export function useVaultState(
	termId: Hex,
	curveId: bigint,
	options?: { chainId?: number; enabled?: boolean }
): VaultQueryResult<VaultState> {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false;

	const results = useReadContracts({
		contracts: [
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'getVault',
				args: [termId, curveId],
				chainId,
			},
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'currentSharePrice',
				args: [termId, curveId],
				chainId,
			},
		] as const,
		query: { enabled },
	});

	const data = results.data?.every((r) => r.status === 'success')
		? (() => {
				const vaultTotals = multiVaultResolveVaultTotals(results.data[0].result);
				const sharePrice = results.data[1].result as bigint;
				return {
					totalAssets: vaultTotals.totalAssets,
					totalShares: vaultTotals.totalShares,
					sharePrice,
				} satisfies VaultState;
			})()
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

/**
 * Previews a deposit by reading fees and expected shares from the contract.
 *
 * Pass `amount` as `0n` or omit it to disable the query until a real
 * amount is available (e.g., while the user is typing).
 *
 * @param termId - The term ID of the vault to deposit into.
 * @param curveId - The bonding curve ID.
 * @param amount - The deposit amount in wei.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled. Defaults to `true` when amount > 0.
 *
 * @example
 * ```tsx
 * const { data: preview } = useDepositPreview(termId, curveId, parseEther('1'))
 * if (preview) {
 *   console.log('Shares out:', preview.sharesOut)
 *   console.log('Entry fee:', formatEther(preview.entryFee))
 * }
 * ```
 */
export function useDepositPreview(
	termId: Hex,
	curveId: bigint,
	amount: bigint,
	options?: { chainId?: number; enabled?: boolean }
): VaultQueryResult<DepositPreview> {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const shouldQuery = options?.enabled !== false && amount > 0n;

	const results = useReadContracts({
		contracts: [
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'previewDeposit',
				args: [termId, curveId, amount],
				chainId,
			},
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'entryFeeAmount',
				args: [amount],
				chainId,
			},
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'protocolFeeAmount',
				args: [amount],
				chainId,
			},
		] as const,
		query: { enabled: shouldQuery },
	});

	const data = results.data?.every((r) => r.status === 'success')
		? (() => {
				const previewResult = results.data[0].result as readonly [bigint, bigint];
				const entryFee = results.data[1].result as bigint;
				const protocolFee = results.data[2].result as bigint;

				return {
					sharesOut: previewResult[0],
					assetsAfterFees: previewResult[1],
					entryFee,
					protocolFee,
				} satisfies DepositPreview;
			})()
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

/**
 * Previews a redemption by reading fees and expected assets from the contract.
 *
 * @param termId - The term ID of the vault to redeem from.
 * @param curveId - The bonding curve ID.
 * @param shares - The number of shares to redeem.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled. Defaults to `true` when shares > 0.
 *
 * @example
 * ```tsx
 * const { data: preview } = useRedeemPreview(termId, curveId, parseEther('100'))
 * if (preview) {
 *   console.log('Assets out:', formatEther(preview.assetsOut))
 *   console.log('Exit fee:', formatEther(preview.exitFee))
 * }
 * ```
 */
export function useRedeemPreview(
	termId: Hex,
	curveId: bigint,
	shares: bigint,
	options?: { chainId?: number; enabled?: boolean }
): VaultQueryResult<RedeemPreview> {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const shouldQuery = options?.enabled !== false && shares > 0n;

	const previewResult = useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'previewRedeem',
		args: [termId, curveId, shares],
		chainId,
		query: { enabled: shouldQuery },
	});

	// The preview result contains the assets out; we need that value for fee calcs.
	const assetsOut =
		previewResult.data !== undefined
			? (previewResult.data as readonly [bigint, bigint])[0]
			: undefined;

	const feeResults = useReadContracts({
		contracts: [
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'exitFeeAmount',
				args: [assetsOut ?? 0n],
				chainId,
			},
			{
				address: multivaultAddress,
				abi: MultiVaultAbi,
				functionName: 'protocolFeeAmount',
				args: [assetsOut ?? 0n],
				chainId,
			},
		] as const,
		query: { enabled: shouldQuery && assetsOut !== undefined },
	});

	const data =
		previewResult.data !== undefined &&
		feeResults.data &&
		feeResults.data.every((r) => r.status === 'success')
			? (() => {
					const preview = previewResult.data as readonly [bigint, bigint];
					const exitFee = feeResults.data[0].result as bigint;
					const protocolFee = feeResults.data[1].result as bigint;

					return {
						assetsOut: preview[0],
						sharesUsed: preview[1],
						exitFee,
						protocolFee,
					} satisfies RedeemPreview;
				})()
			: undefined;

	return {
		data,
		isLoading: previewResult.isLoading || feeResults.isLoading,
		isPending: previewResult.isPending || feeResults.isPending,
		isError: previewResult.isError || feeResults.isError,
		error: previewResult.error ?? feeResults.error,
		refetch: async () => {
			await previewResult.refetch();
			await feeResults.refetch();
		},
	};
}

/**
 * Returns a mutation function to deposit assets into a vault.
 *
 * The deposit is sent as native currency (msg.value). The returned transaction
 * hash can be used with `useWaitForTransactionReceipt` from wagmi.
 *
 * @example
 * ```tsx
 * const { deposit, isPending } = useDeposit()
 *
 * async function handleDeposit() {
 *   const hash = await deposit({
 *     termId,
 *     curveId,
 *     amount: parseEther('1'),
 *     minShares: 0n, // set to preview.sharesOut * slippage for production
 *   })
 * }
 * ```
 */
export function useDeposit(): VaultMutationResult<'deposit', DepositInput> {
	const { multivaultAddress, chainId } = useChainConfig();
	const { address: connectedAddress } = useAccount();
	const { writeContractAsync, isPending, isError, error, data, reset } = useWriteContract();

	const deposit = async (inputs: DepositInput): Promise<Hex> => {
		const { termId, curveId, amount, minShares = 0n } = inputs;
		const receiver = inputs.receiver ?? connectedAddress;

		if (!receiver) {
			throw new Error('No receiver address provided and no wallet connected.');
		}

		return writeContractAsync({
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'deposit',
			args: [receiver, termId, curveId, minShares],
			value: amount,
			chainId,
		}) as Promise<Hex>;
	};

	return {
		deposit,
		isPending,
		isError,
		error,
		data,
		reset,
	};
}

/**
 * Returns a mutation function to redeem shares from a vault.
 *
 * @example
 * ```tsx
 * const { redeem, isPending } = useRedeem()
 *
 * async function handleRedeem() {
 *   const hash = await redeem({
 *     termId,
 *     curveId,
 *     shares: parseEther('50'),
 *     minAssets: 0n, // set for slippage protection in production
 *   })
 * }
 * ```
 */
export function useRedeem(): VaultMutationResult<'redeem', RedeemInput> {
	const { multivaultAddress, chainId } = useChainConfig();
	const { address: connectedAddress } = useAccount();
	const { writeContractAsync, isPending, isError, error, data, reset } = useWriteContract();

	const redeem = async (inputs: RedeemInput): Promise<Hex> => {
		const { termId, curveId, shares, minAssets = 0n } = inputs;
		const receiver = inputs.receiver ?? connectedAddress;

		if (!receiver) {
			throw new Error('No receiver address provided and no wallet connected.');
		}

		return writeContractAsync({
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'redeem',
			args: [receiver, termId, curveId, shares, minAssets],
			chainId,
		}) as Promise<Hex>;
	};

	return {
		redeem,
		isPending,
		isError,
		error,
		data,
		reset,
	};
}

/**
 * Returns a mutation function to deposit into multiple vaults in a single transaction.
 *
 * @example
 * ```tsx
 * const { depositBatch, isPending } = useDepositBatch()
 *
 * async function handleBatchDeposit() {
 *   const hash = await depositBatch({
 *     termIds: [termId1, termId2],
 *     curveIds: [1n, 1n],
 *     assets: [parseEther('1'), parseEther('0.5')],
 *   })
 * }
 * ```
 */
export function useDepositBatch(): VaultMutationResult<'depositBatch', DepositBatchInput> {
	const { multivaultAddress, chainId } = useChainConfig();
	const { address: connectedAddress } = useAccount();
	const { writeContractAsync, isPending, isError, error, data, reset } = useWriteContract();

	const depositBatch = async (inputs: DepositBatchInput): Promise<Hex> => {
		const { termIds, curveIds, assets } = inputs;
		const receiver = inputs.receiver ?? connectedAddress;
		const minShares = inputs.minShares ?? termIds.map(() => 0n);

		if (!receiver) {
			throw new Error('No receiver address provided and no wallet connected.');
		}

		if (
			termIds.length !== curveIds.length ||
			termIds.length !== assets.length ||
			termIds.length !== minShares.length
		) {
			throw new Error('All input arrays must have the same length.');
		}

		const totalValue = assets.reduce((sum, v) => sum + v, 0n);

		return writeContractAsync({
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'depositBatch',
			args: [receiver, termIds, curveIds, assets, minShares],
			value: totalValue,
			chainId,
		}) as Promise<Hex>;
	};

	return {
		depositBatch,
		isPending,
		isError,
		error,
		data,
		reset,
	};
}

/**
 * Returns a mutation function to redeem shares from multiple vaults in a single transaction.
 *
 * @example
 * ```tsx
 * const { redeemBatch, isPending } = useRedeemBatch()
 *
 * async function handleBatchRedeem() {
 *   const hash = await redeemBatch({
 *     termIds: [termId1, termId2],
 *     curveIds: [1n, 1n],
 *     shares: [100n, 200n],
 *   })
 * }
 * ```
 */
export function useRedeemBatch(): VaultMutationResult<'redeemBatch', RedeemBatchInput> {
	const { multivaultAddress, chainId } = useChainConfig();
	const { address: connectedAddress } = useAccount();
	const { writeContractAsync, isPending, isError, error, data, reset } = useWriteContract();

	const redeemBatch = async (inputs: RedeemBatchInput): Promise<Hex> => {
		const { termIds, curveIds, shares } = inputs;
		const receiver = inputs.receiver ?? connectedAddress;
		const minAssets = inputs.minAssets ?? termIds.map(() => 0n);

		if (!receiver) {
			throw new Error('No receiver address provided and no wallet connected.');
		}

		if (
			termIds.length !== curveIds.length ||
			termIds.length !== shares.length ||
			termIds.length !== minAssets.length
		) {
			throw new Error('All input arrays must have the same length.');
		}

		return writeContractAsync({
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'redeemBatch',
			args: [receiver, termIds, curveIds, shares, minAssets],
			chainId,
		}) as Promise<Hex>;
	};

	return {
		redeemBatch,
		isPending,
		isError,
		error,
		data,
		reset,
	};
}

/**
 * Converts a share amount to its equivalent asset value for a given vault.
 *
 * @param termId - The term ID of the vault.
 * @param curveId - The bonding curve ID.
 * @param shares - The share amount to convert.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: assets } = useConvertToAssets(termId, curveId, myShares)
 * ```
 */
export function useConvertToAssets(
	termId: Hex,
	curveId: bigint,
	shares: bigint,
	options?: { chainId?: number; enabled?: boolean }
) {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'convertToAssets',
		args: [termId, curveId, shares],
		chainId,
		query: { enabled },
	});
}

/**
 * Converts an asset amount to its equivalent share value for a given vault.
 *
 * @param termId - The term ID of the vault.
 * @param curveId - The bonding curve ID.
 * @param assets - The asset amount to convert.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: shares } = useConvertToShares(termId, curveId, myAssets)
 * ```
 */
export function useConvertToShares(
	termId: Hex,
	curveId: bigint,
	assets: bigint,
	options?: { chainId?: number; enabled?: boolean }
) {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'convertToShares',
		args: [termId, curveId, assets],
		chainId,
		query: { enabled },
	});
}

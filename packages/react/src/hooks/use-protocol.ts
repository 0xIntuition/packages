'use client';

import { MultiVaultAbi } from '@0xintuition/protocol';
import type { ContractFunctionArgs, ContractFunctionReturnType, Hex } from 'viem';
import type { UseReadContractReturnType } from 'wagmi';
import { useReadContract } from 'wagmi';

import { useChainConfig, useIntuitionConfig } from '../provider';
import type { IntuitionConfig, ProtocolFees } from '../types';

/**
 * Returns the Intuition protocol configuration from the nearest provider.
 * Alias for {@link useIntuitionConfig} for discoverability.
 *
 * @example
 * ```tsx
 * const { chainId, multivaultAddress, chain } = useProtocolConfig()
 * ```
 */
export function useProtocolConfig(): IntuitionConfig {
	return useIntuitionConfig();
}

/**
 * Reads the current fee structure from the MultiVault contract.
 *
 * Returns entry fee, exit fee, and protocol fee as read from `getVaultFees`.
 *
 * @example
 * ```tsx
 * const { data: fees, isLoading } = useProtocolFees()
 * if (fees) {
 *   console.log('Entry fee:', fees.entryFee)
 * }
 * ```
 */
export function useProtocolFees(options?: { chainId?: number }): UseProtocolFeesResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getVaultFees',
		chainId,
		query: {
			select(data): ProtocolFees {
				// viem decodes the VaultFees struct as an object with named fields
				const result = data as unknown as {
					entryFee: bigint;
					exitFee: bigint;
					protocolFee: bigint;
				};
				return {
					entryFee: result.entryFee,
					exitFee: result.exitFee,
					protocolFee: result.protocolFee,
				};
			},
		},
	});
}

/**
 * Reads the base cost to create an atom from the MultiVault contract.
 *
 * @example
 * ```tsx
 * const { data: atomCost } = useAtomCost()
 * // atomCost is bigint in wei
 * ```
 */
export function useAtomCost(options?: { chainId?: number }): UseAtomCostResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getAtomCost',
		chainId,
	});
}

/**
 * Reads the base cost to create a triple from the MultiVault contract.
 *
 * @example
 * ```tsx
 * const { data: tripleCost } = useTripleCost()
 * // tripleCost is bigint in wei
 * ```
 */
export function useTripleCost(options?: { chainId?: number }): UseTripleCostResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getTripleCost',
		chainId,
	});
}

/**
 * Reads the general configuration struct from the MultiVault contract.
 *
 * @example
 * ```tsx
 * const { data: config } = useGeneralConfig()
 * ```
 */
export function useGeneralConfig(options?: { chainId?: number }): UseGeneralConfigResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getGeneralConfig',
		chainId,
	});
}

/**
 * Reads the bonding curve configuration from the MultiVault contract.
 * Includes the default curve ID and registry address.
 *
 * @example
 * ```tsx
 * const { data: curveConfig } = useBondingCurveConfig()
 * ```
 */
export function useBondingCurveConfig(options?: { chainId?: number }): UseBondingCurveConfigResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getBondingCurveConfig',
		chainId,
	});
}

/**
 * Reads the atom configuration from the MultiVault contract.
 * Returns `atomCreationProtocolFee` and `atomWalletDepositFee`.
 *
 * @example
 * ```tsx
 * const { data: atomConfig } = useAtomConfig()
 * if (atomConfig) {
 *   console.log('Creation fee:', atomConfig.atomCreationProtocolFee)
 * }
 * ```
 */
export function useAtomConfig(options?: { chainId?: number }): UseAtomConfigResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getAtomConfig',
		chainId,
	});
}

/**
 * Reads the triple configuration from the MultiVault contract.
 * Returns `tripleCreationProtocolFee` and `atomDepositFractionForTriple`.
 *
 * @example
 * ```tsx
 * const { data: tripleConfig } = useTripleConfig()
 * if (tripleConfig) {
 *   console.log('Creation fee:', tripleConfig.tripleCreationProtocolFee)
 * }
 * ```
 */
export function useTripleConfig(options?: { chainId?: number }): UseTripleConfigResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getTripleConfig',
		chainId,
	});
}

/**
 * Reads the wallet configuration from the MultiVault contract.
 *
 * @example
 * ```tsx
 * const { data: walletConfig } = useWalletConfig()
 * ```
 */
export function useWalletConfig(options?: { chainId?: number }): UseWalletConfigResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getWalletConfig',
		chainId,
	});
}

/**
 * Checks whether a term (atom or triple) has been created in the MultiVault.
 *
 * @param termId - The term ID to check.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: exists } = useIsTermCreated(termId)
 * if (exists) console.log('Term exists on-chain')
 * ```
 */
export function useIsTermCreated(
	termId: Hex | undefined,
	options?: { chainId?: number; enabled?: boolean }
): UseIsTermCreatedResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false && termId !== undefined;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'isTermCreated',
		args: termId ? [termId] : undefined,
		chainId,
		query: { enabled },
	});
}

/**
 * Reads the counter-triple ID for a given triple from the MultiVault contract.
 * Counter-triples represent the negation of a triple (same subject and predicate, inverted assertion).
 *
 * @param tripleId - The triple term ID.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: counterId } = useCounterTripleId(tripleTermId)
 * ```
 */
export function useCounterTripleId(
	tripleId: Hex | undefined,
	options?: { chainId?: number; enabled?: boolean }
): UseCounterTripleIdResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false && tripleId !== undefined;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getCounterIdFromTripleId',
		args: tripleId ? [tripleId] : undefined,
		chainId,
		query: { enabled },
	});
}

/**
 * Previews atom creation: returns expected shares and fees for a given asset amount.
 *
 * @param termId - The term ID of the atom to create.
 * @param assets - The asset amount in wei.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: preview } = usePreviewAtomCreate(atomTermId, parseEther('0.01'))
 * ```
 */
export function usePreviewAtomCreate(
	termId: Hex | undefined,
	assets: bigint,
	options?: { chainId?: number; enabled?: boolean }
): UsePreviewAtomCreateResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false && termId !== undefined && assets > 0n;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'previewAtomCreate',
		args: termId ? [termId, assets] : undefined,
		chainId,
		query: { enabled },
	});
}

/**
 * Previews triple creation: returns expected shares and fees for a given asset amount.
 * Keyed on the three atom ids, since the contract evaluates the atom-deposit fraction against the
 * atom vaults and the triple does not exist yet.
 *
 * @param subjectId - The subject atom ID.
 * @param predicateId - The predicate atom ID.
 * @param objectId - The object atom ID.
 * @param assets - The asset amount in wei.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: preview } = usePreviewTripleCreate(subjectId, predicateId, objectId, parseEther('0.01'))
 * ```
 */
export function usePreviewTripleCreate(
	subjectId: Hex | undefined,
	predicateId: Hex | undefined,
	objectId: Hex | undefined,
	assets: bigint,
	options?: { chainId?: number; enabled?: boolean }
): UsePreviewTripleCreateResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const hasAtoms = subjectId !== undefined && predicateId !== undefined && objectId !== undefined;
	const enabled = options?.enabled !== false && hasAtoms && assets > 0n;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'previewTripleCreate',
		args: hasAtoms ? [subjectId, predicateId, objectId, assets] : undefined,
		chainId,
		query: { enabled },
	});
}

export type UseProtocolFeesResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getVaultFees',
	readonly [],
	ProtocolFees
>;
export type UseAtomCostResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getAtomCost',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getAtomCost'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getAtomCost'> | undefined
>;
export type UseTripleCostResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getTripleCost',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getTripleCost'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getTripleCost'> | undefined
>;
export type UseGeneralConfigResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getGeneralConfig',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getGeneralConfig'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getGeneralConfig'> | undefined
>;
export type UseBondingCurveConfigResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getBondingCurveConfig',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getBondingCurveConfig'>,
	| ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getBondingCurveConfig'>
	| undefined
>;
export type UseAtomConfigResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getAtomConfig',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getAtomConfig'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getAtomConfig'> | undefined
>;
export type UseTripleConfigResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getTripleConfig',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getTripleConfig'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getTripleConfig'> | undefined
>;
export type UseWalletConfigResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getWalletConfig',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getWalletConfig'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getWalletConfig'> | undefined
>;
export type UseIsTermCreatedResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'isTermCreated',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'isTermCreated'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'isTermCreated'> | undefined
>;
export type UseCounterTripleIdResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'getCounterIdFromTripleId',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'getCounterIdFromTripleId'>,
	| ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'getCounterIdFromTripleId'>
	| undefined
>;
export type UsePreviewAtomCreateResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'previewAtomCreate',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'previewAtomCreate'>,
	ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'previewAtomCreate'> | undefined
>;
export type UsePreviewTripleCreateResult = UseReadContractReturnType<
	typeof MultiVaultAbi,
	'previewTripleCreate',
	ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'previewTripleCreate'>,
	| ContractFunctionReturnType<typeof MultiVaultAbi, 'view' | 'pure', 'previewTripleCreate'>
	| undefined
>;

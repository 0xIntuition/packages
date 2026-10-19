import type { Abi, AbiFunction } from 'viem';

import {
	AtomWardenAbi,
	BaseEmissionsControllerAbi,
	DynamicFeeFlatPriceCurveAbi,
	MultiVaultAbi,
	SatelliteEmissionsControllerAbi,
	TrustAbi,
	TrustBondingAbi,
	WrappedTrustAbi,
} from '../abis/core';
import {
	FeeProxyAbi,
	MetaERC20HubAbi,
	MetaERC20SpokeAbi,
	MetaNativeSpokeAbi,
	TrustSwapAndBridgeRouterAbi,
} from '../abis/periphery';
import * as encoderExports from '../encoders';
import {
	type CoreEncoderContract,
	type CoreEncoderKind,
	coreEncoderCatalog,
	formatCoreEncoderHelp,
} from '../encoders/core';
import {
	formatPeripheryEncoderHelp,
	type PeripheryEncoderContract,
	type PeripheryEncoderKind,
	peripheryEncoderCatalog,
} from '../encoders/periphery';

export type EncoderSurface = 'core' | 'periphery';

export type EncoderCatalogEntry = {
	surface: EncoderSurface;
	contract: string;
	kind: string;
	encoderName: string;
	abiName: string;
	functionName: string;
	stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
	sourceWrapper: string;
	sourceFile: string;
};

export type EncoderRuntimeEntry = EncoderCatalogEntry & {
	abi: Abi;
	abiFunction: AbiFunction;
	encode: (...args: unknown[]) => `0x${string}`;
};

export type EncoderListOptions = {
	surface?: EncoderSurface | 'all';
	contract?: string;
	kind?: string;
	includeMethods?: boolean;
};

const abiRegistry: Record<string, Abi> = {
	AtomWardenAbi,
	BaseEmissionsControllerAbi,
	DynamicFeeFlatPriceCurveAbi,
	FeeProxyAbi,
	MetaERC20HubAbi,
	MetaERC20SpokeAbi,
	MetaNativeSpokeAbi,
	MultiVaultAbi,
	SatelliteEmissionsControllerAbi,
	TrustAbi,
	TrustBondingAbi,
	TrustSwapAndBridgeRouterAbi,
	WrappedTrustAbi,
};

const encoderCatalog: readonly EncoderCatalogEntry[] = [
	...coreEncoderCatalog.map((entry) => ({
		...entry,
		surface: 'core' as const,
	})),
	...peripheryEncoderCatalog.map((entry) => ({
		...entry,
		surface: 'periphery' as const,
	})),
];

function getAbiFunction(abi: Abi, functionName: string): AbiFunction {
	const match = abi.find(
		(item): item is AbiFunction => item.type === 'function' && item.name === functionName
	);

	if (!match) {
		throw new Error(`Function ${functionName} not found in ABI.`);
	}

	return match;
}

function buildRuntimeEntry(entry: EncoderCatalogEntry): EncoderRuntimeEntry {
	const encode = (encoderExports as Record<string, unknown>)[entry.encoderName];
	if (typeof encode !== 'function') {
		throw new Error(`Encoder export ${entry.encoderName} not found.`);
	}

	const abi = abiRegistry[entry.abiName];
	if (!abi) {
		throw new Error(`ABI export ${entry.abiName} not found.`);
	}

	return {
		...entry,
		abi,
		abiFunction: getAbiFunction(abi, entry.functionName),
		encode: encode as (...args: unknown[]) => `0x${string}`,
	};
}

export const encoderRegistry: readonly EncoderRuntimeEntry[] =
	encoderCatalog.map(buildRuntimeEntry);

export function getEncoderByName(encoderName: string): EncoderRuntimeEntry | undefined {
	return encoderRegistry.find((entry) => entry.encoderName === encoderName);
}

export function listEncoders(options: EncoderListOptions = {}): EncoderCatalogEntry[] {
	const { surface = 'all', contract, kind } = options;

	return encoderCatalog.filter((entry) => {
		if (surface !== 'all' && entry.surface !== surface) {
			return false;
		}
		if (contract && entry.contract !== contract) {
			return false;
		}
		if (kind && entry.kind !== kind) {
			return false;
		}
		return true;
	});
}

export function formatEncoderHelp(options: EncoderListOptions = {}): string {
	const { surface = 'all', contract, kind, includeMethods = true } = options;

	if (surface === 'core') {
		return formatCoreEncoderHelp({
			contract: contract as CoreEncoderContract | undefined,
			kind: kind as CoreEncoderKind | undefined,
			includeMethods,
		});
	}

	if (surface === 'periphery') {
		return formatPeripheryEncoderHelp({
			contract: contract as PeripheryEncoderContract | undefined,
			kind: kind as PeripheryEncoderKind | undefined,
			includeMethods,
		});
	}

	return [
		formatCoreEncoderHelp({
			contract: contract as CoreEncoderContract | undefined,
			kind: kind as CoreEncoderKind | undefined,
			includeMethods,
		}),
		'',
		formatPeripheryEncoderHelp({
			contract: contract as PeripheryEncoderContract | undefined,
			kind: kind as PeripheryEncoderKind | undefined,
			includeMethods,
		}),
	].join('\n');
}

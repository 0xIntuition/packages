import {
	type FeeGuard,
	feeProxyCreateAtomsWithUrisViaEncode,
	feeProxyPreviewCreationFee,
} from '@0xintuition/periphery';
import { multiVaultGetAtomUriConfig, type ReadConfig } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';

export type FeeProxyCreateAtomsWithUrisQuote = {
	affiliate: Address;
	totalGrossAssets: bigint;
	previewedFee: bigint;
	previewedForwarded: bigint;
	maxUriCount: number;
	maxUriLength: number;
};

export type FeeProxyPrepareCreateAtomsWithUrisTxResult = {
	args: readonly [Address, Hex[], bigint[], Hex[][], FeeGuard];
	calldata: Hex;
	value: bigint;
	quote: FeeProxyCreateAtomsWithUrisQuote;
};

type FeeProxyCreateAtomsWithUrisDeps = {
	previewCreationFee: typeof feeProxyPreviewCreationFee;
	getAtomUriConfig: typeof multiVaultGetAtomUriConfig;
};

const defaultFeeProxyCreateAtomsWithUrisDeps: FeeProxyCreateAtomsWithUrisDeps = {
	previewCreationFee: feeProxyPreviewCreationFee,
	getAtomUriConfig: multiVaultGetAtomUriConfig,
};

function sumBigints(values: bigint[]): bigint {
	let total = 0n;
	for (const value of values) {
		total += value;
	}
	return total;
}

function hexByteLength(value: Hex): number {
	return (value.length - 2) / 2;
}

/**
 * Validates every atom's URI list against MultiVault's live `maxUriCount` /
 * `maxUriLength` bounds. `createAtomsWithUris` reverts on-chain if either is exceeded,
 * but only after the affiliate fee has already been computed — checking client-side
 * first avoids a wasted simulate/revert round trip for a mistake that is easy to make
 * silently (a slightly-too-long URI, one too many per atom).
 */
function assertUrisWithinBounds(uris: Hex[][], maxUriCount: number, maxUriLength: number): void {
	uris.forEach((atomUris, atomIndex) => {
		if (atomUris.length > maxUriCount) {
			throw new Error(
				`Atom ${atomIndex} supplies ${atomUris.length} URIs, exceeding the max of ${maxUriCount}.`
			);
		}
		atomUris.forEach((uri, uriIndex) => {
			const byteLength = hexByteLength(uri);
			if (byteLength > maxUriLength) {
				throw new Error(
					`Atom ${atomIndex} URI ${uriIndex} is ${byteLength} bytes, exceeding the max of ${maxUriLength}.`
				);
			}
		});
	});
}

/**
 * Prepares a `createAtomsWithUrisVia` transaction routed through an affiliate: reads
 * the live URI bounds and validates every atom's URI list against them, computes the
 * affiliate's creation-fee value (so the caller can size `msg.value` and a
 * `FeeGuard` cap correctly), and returns the calldata.
 * @param configs `feeProxy` and `multiVault` read configs (both resolve against the same public client).
 * @param inputs The affiliate, per-atom data/assets/URIs, and the caller's front-run guard.
 * @param deps Injectable protocol/periphery read primitives.
 * @returns The `createAtomsWithUrisVia` calldata, args, gross value, and the fee/bounds quote it was built from.
 */
export async function feeProxyPrepareCreateAtomsWithUrisTx(
	configs: { feeProxy: ReadConfig; multiVault: ReadConfig },
	inputs: {
		affiliate: Address;
		atomDatas: Hex[];
		assets: bigint[];
		uris: Hex[][];
		feeGuard: FeeGuard;
	},
	deps: FeeProxyCreateAtomsWithUrisDeps = defaultFeeProxyCreateAtomsWithUrisDeps
): Promise<FeeProxyPrepareCreateAtomsWithUrisTxResult> {
	const { affiliate, atomDatas, assets, uris, feeGuard } = inputs;

	if (
		atomDatas.length === 0 ||
		atomDatas.length !== assets.length ||
		atomDatas.length !== uris.length
	) {
		throw new Error('atomDatas, assets, and uris must be the same non-zero length.');
	}

	const [maxUriCount, maxUriLength] = await deps.getAtomUriConfig(configs.multiVault);
	assertUrisWithinBounds(uris, maxUriCount, maxUriLength);

	const totalGrossAssets = sumBigints(assets);
	const [previewedFee, previewedForwarded] = await deps.previewCreationFee(configs.feeProxy, {
		args: [affiliate, totalGrossAssets],
	});

	const args = [affiliate, atomDatas, assets, uris, feeGuard] as const;
	const calldata = feeProxyCreateAtomsWithUrisViaEncode(
		affiliate,
		atomDatas,
		assets,
		uris,
		feeGuard
	);

	return {
		args,
		calldata,
		value: totalGrossAssets,
		quote: {
			affiliate,
			totalGrossAssets,
			previewedFee,
			previewedForwarded,
			maxUriCount,
			maxUriLength,
		},
	};
}

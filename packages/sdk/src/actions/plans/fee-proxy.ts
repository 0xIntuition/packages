import type { Address, Hex } from 'viem';
import { feeProxyPrepareCreateAtomsWithUrisTx } from '../index';

import { buildPlanEnvelope, buildPlanStep, requireContext, toPureReadConfig } from './helpers';

type IntuitionCoreChainId = 1155 | 13579;

/**
 * Local mirror of `@0xintuition/periphery`'s `FeeGuard`, field-for-field. Kept as a
 * separate type here (rather than importing it) so this package's public `.d.ts` doesn't
 * leak a type from a devDependency — the same convention `DynamicFeeCurvePlanConfig`
 * already follows in `plans/dynamic-fee-curve.ts`.
 */
export type FeeProxyFeeGuardPlanInput = {
	maxFeeBps: bigint;
	maxFixedFee: bigint;
};

export type FeeProxyCreateAtomsWithUrisPlanReadContext = {
	previewCreationFee?: readonly [bigint, bigint];
	atomUriConfig?: readonly [number, number];
};

export type BuildFeeProxyCreateAtomsWithUrisPlanInputs = {
	chainId?: IntuitionCoreChainId;
	feeProxyAddress: Address;
	multiVaultAddress: Address;
	affiliate: Address;
	atomDatas: Hex[];
	assets: bigint[];
	uris: Hex[][];
	feeGuard: FeeProxyFeeGuardPlanInput;
	readContext?: FeeProxyCreateAtomsWithUrisPlanReadContext;
};

/**
 * Builds a `createAtomsWithUrisVia` plan routed through an affiliate: validates every
 * atom's URI list against the live URI bounds, quotes the affiliate's creation fee, and
 * returns the calldata.
 * @param inputs Chain, contract addresses, the affiliate, per-atom data/assets/URIs, the caller's fee guard, and precomputed read values.
 * @returns An agent-action envelope with the creation step and the fee/bounds quote it was built from.
 */
export async function feeProxyCreateAtomsWithUrisEnvelope(
	inputs: BuildFeeProxyCreateAtomsWithUrisPlanInputs
) {
	const planName = 'buildFeeProxyCreateAtomsWithUrisPlan';
	const {
		chainId = 1155,
		feeProxyAddress,
		multiVaultAddress,
		affiliate,
		atomDatas,
		assets,
		uris,
		feeGuard,
		readContext,
	} = inputs;

	const deps = {
		previewCreationFee: async () =>
			requireContext(readContext?.previewCreationFee, planName, 'readContext.previewCreationFee'),
		getAtomUriConfig: async () =>
			requireContext(readContext?.atomUriConfig, planName, 'readContext.atomUriConfig'),
	} satisfies NonNullable<Parameters<typeof feeProxyPrepareCreateAtomsWithUrisTx>[2]>;

	const prepared = await feeProxyPrepareCreateAtomsWithUrisTx(
		{
			feeProxy: toPureReadConfig(feeProxyAddress),
			multiVault: toPureReadConfig(multiVaultAddress),
		},
		{ affiliate, atomDatas, assets, uris, feeGuard },
		deps
	);

	return buildPlanEnvelope({
		action: 'feeProxy.createAtomsWithUris',
		module: 'plans/fee-proxy',
		method: planName,
		label: 'FeeProxy atom creation with URI context',
		description:
			'Routes atom creation with URI context through an affiliate, with affiliate-fee and refund accounting intact.',
		tags: ['fee-proxy', 'create', 'atoms'],
		context: {
			feeProxyAddress,
			multiVaultAddress,
			affiliate,
			atomCount: atomDatas.length,
		},
		steps: [
			buildPlanStep({
				id: 'fee-proxy-create-atoms-with-uris',
				intent: {
					chainId,
					contract: 'fee-proxy',
					address: feeProxyAddress,
				},
				data: prepared.calldata,
				value: prepared.value,
				label: 'Create atoms with URI context',
				description: 'Submit atom creation with URI context, routed through the affiliate.',
			}),
		],
		estimates: {
			quote: prepared.quote,
			value: prepared.value,
		},
	});
}

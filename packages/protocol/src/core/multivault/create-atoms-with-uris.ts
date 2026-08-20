import { type ContractFunctionArgs, type Hex, zeroAddress } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type AtomUriLimits = {
	maxUriCount: number | bigint;
	maxUriLength: number | bigint;
};

export type CreateAtomsWithUrisArgs = ContractFunctionArgs<
	typeof MultiVaultAbi,
	'payable',
	'createAtomsWithUris'
>;

export type CreateAtomsWithUrisInputs = {
	args: CreateAtomsWithUrisArgs;
	/** Must equal the sum of `assets`; kept required to prevent accidental underpayment. */
	value: bigint;
	/** Optional live values returned by `getAtomUriConfig`. */
	uriLimits?: AtomUriLimits;
};

/**
 * Validates errors that can be established locally. Simulation remains the
 * authority for approvals, creation cost, duplicate atoms, and live config.
 */
export function multiVaultValidateCreateAtomsWithUris(inputs: CreateAtomsWithUrisInputs): void {
	const [creator, atomData, assets, uris] = inputs.args;
	if (creator.toLowerCase() === zeroAddress) {
		throw new Error('creator must not be the zero address');
	}
	if (atomData.length === 0) {
		throw new Error('createAtomsWithUris requires at least one atom');
	}
	if (atomData.length !== assets.length || atomData.length !== uris.length) {
		throw new Error('atom data, assets, and URI outer arrays must have the same length');
	}
	const requiredValue = assets.reduce((total, amount) => total + amount, 0n);
	if (inputs.value !== requiredValue) {
		throw new Error('value must equal the sum of atom assets');
	}

	if (!inputs.uriLimits) {
		return;
	}
	const maxUriCount = BigInt(inputs.uriLimits.maxUriCount);
	const maxUriLength = BigInt(inputs.uriLimits.maxUriLength);
	for (const atomUris of uris) {
		if (BigInt(atomUris.length) > maxUriCount) {
			throw new Error('atom URI count exceeds the supplied live limit');
		}
		for (const uri of atomUris) {
			if (hexByteLength(uri) > maxUriLength) {
				throw new Error('atom URI byte length exceeds the supplied live limit');
			}
		}
	}
}

/** Simulates and submits a URI-aware atom creation transaction. */
export async function multiVaultCreateAtomsWithUris(
	config: WriteConfig,
	inputs: CreateAtomsWithUrisInputs
) {
	multiVaultValidateCreateAtomsWithUris(inputs);
	const { address, walletClient, publicClient } = config;
	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultAbi,
		functionName: 'createAtomsWithUris',
		args: inputs.args,
		value: inputs.value,
	});

	return await walletClient.writeContract(request);
}

function hexByteLength(value: Hex): bigint {
	return BigInt((value.length - 2) / 2);
}

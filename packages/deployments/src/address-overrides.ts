import { type Address, getAddress, isAddress } from 'viem';

import { type IntuitionDeploymentName, intuitionDeployments } from './deployments.js';
import { getContractAddressFromChainId } from './helpers.js';

/** Caller-supplied addresses, keyed by deployment name and chain ID. */
export type AddressOverrides = Partial<
	Record<IntuitionDeploymentName, Partial<Record<number, Address>>>
>;

export type ParseAddressOverridesOptions = { source?: string };

export class AddressOverridesParseError extends Error {
	readonly source: string | undefined;

	constructor(message: string, source?: string) {
		const label = source ? ` (${source})` : '';
		super(`Invalid contract address overrides${label}: ${message}`);
		this.name = 'AddressOverridesParseError';
		this.source = source;
	}
}

export const INTUITION_DEPLOYMENT_NAMES = Object.freeze(
	Object.keys(intuitionDeployments) as IntuitionDeploymentName[]
);

export function isIntuitionDeploymentName(value: string): value is IntuitionDeploymentName {
	return Object.hasOwn(intuitionDeployments, value);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function acceptsAddress(value: unknown): value is Address {
	if (typeof value !== 'string' || !isAddress(value, { strict: false })) {
		return false;
	}
	const hex = value.slice(2);
	return (
		hex === hex.toLowerCase() || hex === hex.toUpperCase() || isAddress(value, { strict: true })
	);
}

function parseChains(
	name: IntuitionDeploymentName,
	value: unknown,
	source?: string
): Partial<Record<number, Address>> {
	if (!isObject(value)) {
		throw new AddressOverridesParseError(
			`"${name}" must map chain ids to addresses (e.g. {"13579":"0x…"})`,
			source
		);
	}
	const result: Partial<Record<number, Address>> = {};
	for (const [key, address] of Object.entries(value)) {
		if (!/^[1-9]\d*$/.test(key.trim())) {
			throw new AddressOverridesParseError(
				`"${name}" has non-numeric chain id key "${key}"`,
				source
			);
		}
		const chainId = Number(key.trim());
		if (!Number.isSafeInteger(chainId)) {
			throw new AddressOverridesParseError(
				`"${name}" chain id "${key}" is not a safe integer`,
				source
			);
		}
		if (result[chainId] !== undefined) {
			throw new AddressOverridesParseError(
				`"${name}" lists chain id ${chainId} more than once (keys differ only by whitespace)`,
				source
			);
		}
		if (!acceptsAddress(address)) {
			throw new AddressOverridesParseError(
				`"${name}"[${chainId}] is not a valid EVM address (got ${JSON.stringify(address)})`,
				source
			);
		}
		result[chainId] = getAddress(address);
	}
	return result;
}

/** Parse optional JSON without reading environment variables or process state. */
export function parseAddressOverrides(
	json: string | undefined | null,
	options: ParseAddressOverridesOptions = {}
): AddressOverrides {
	if (json == null || json.trim() === '') {
		return {};
	}
	let value: unknown;
	try {
		value = JSON.parse(json.trim());
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new AddressOverridesParseError(`not valid JSON (${reason})`, options.source);
	}
	if (!isObject(value)) {
		throw new AddressOverridesParseError(
			'expected a JSON object keyed by contract name (e.g. {"MultiVault":{"13579":"0x…"}})',
			options.source
		);
	}
	const result: AddressOverrides = {};
	for (const [name, chains] of Object.entries(value)) {
		if (!isIntuitionDeploymentName(name)) {
			throw new AddressOverridesParseError(
				`unknown contract name "${name}" (known: ${INTUITION_DEPLOYMENT_NAMES.join(', ')})`,
				options.source
			);
		}
		result[name] = parseChains(name, chains, options.source);
	}
	return result;
}

export function hasAddressOverrides(overrides: AddressOverrides | undefined): boolean {
	return INTUITION_DEPLOYMENT_NAMES.some((name) =>
		Object.values(overrides?.[name] ?? {}).some((address) => address !== undefined)
	);
}

/** Later layers win for each name/chain pair; empty layers contribute nothing. */
export function mergeAddressOverrides(
	...layers: Array<AddressOverrides | undefined>
): AddressOverrides | undefined {
	const result: AddressOverrides = {};
	let populated = false;
	for (const layer of layers) {
		for (const name of INTUITION_DEPLOYMENT_NAMES) {
			for (const [key, address] of Object.entries(layer?.[name] ?? {})) {
				if (address) {
					const chains = result[name] ?? {};
					chains[Number(key)] = address;
					result[name] = chains;
					populated = true;
				}
			}
		}
	}
	return populated ? result : undefined;
}

/** Resolve known addresses, omitting deployments absent on the requested chain. */
export function resolveContractAddressSet(
	chainId: number,
	overrides?: AddressOverrides
): Partial<Record<IntuitionDeploymentName, Address>> {
	const result: Partial<Record<IntuitionDeploymentName, Address>> = {};
	for (const name of INTUITION_DEPLOYMENT_NAMES) {
		if (
			overrides?.[name]?.[chainId] !== undefined ||
			intuitionDeployments[name]?.[chainId] !== undefined
		) {
			result[name] = getContractAddressFromChainId(name, chainId, overrides);
		}
	}
	return result;
}

export function listOverriddenContractNames(
	chainId: number,
	overrides?: AddressOverrides
): IntuitionDeploymentName[] {
	return INTUITION_DEPLOYMENT_NAMES.filter((name) => {
		const address = overrides?.[name]?.[chainId];
		return address !== undefined && address !== intuitionDeployments[name]?.[chainId];
	});
}

export type ContractAddressSetSummary = {
	readonly chainId: number;
	readonly overridden: readonly IntuitionDeploymentName[];
	readonly resolvedSet: Readonly<Partial<Record<IntuitionDeploymentName, Address>>>;
};

export function summarizeContractAddressSet(
	chainId: number,
	overrides?: AddressOverrides
): ContractAddressSetSummary {
	return {
		chainId,
		overridden: listOverriddenContractNames(chainId, overrides),
		resolvedSet: resolveContractAddressSet(chainId, overrides),
	};
}

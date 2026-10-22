type UnknownRecord = Record<string | number, unknown>;

export type MultiVaultResolvedVaultTotals = {
	totalAssets: bigint;
	totalShares: bigint;
};

export function multiVaultResolveDefaultCurveId(configResult: unknown): bigint {
	if (Array.isArray(configResult) && typeof configResult[1] === 'bigint') {
		return configResult[1];
	}

	if (typeof configResult === 'object' && configResult !== null) {
		const configAsRecord = configResult as UnknownRecord;
		const byName = configAsRecord.defaultCurveId;
		if (typeof byName === 'bigint') {
			return byName;
		}

		const byIndex = configAsRecord[1];
		if (typeof byIndex === 'bigint') {
			return byIndex;
		}
	}

	throw new Error('Unable to resolve default curve ID from bonding curve config.');
}

export function multiVaultResolveVaultTotals(vaultResult: unknown): MultiVaultResolvedVaultTotals {
	if (
		Array.isArray(vaultResult) &&
		typeof vaultResult[0] === 'bigint' &&
		typeof vaultResult[1] === 'bigint'
	) {
		return {
			totalAssets: vaultResult[0],
			totalShares: vaultResult[1],
		};
	}

	if (typeof vaultResult === 'object' && vaultResult !== null) {
		const vaultAsRecord = vaultResult as UnknownRecord;
		const totalAssets = vaultAsRecord.totalAssets ?? vaultAsRecord[0];
		const totalShares = vaultAsRecord.totalShares ?? vaultAsRecord[1];

		if (typeof totalAssets === 'bigint' && typeof totalShares === 'bigint') {
			return {
				totalAssets,
				totalShares,
			};
		}
	}

	throw new Error('Unable to resolve vault totals from getVault response.');
}

/**
 * The fields of `getGeneralConfig` that fee and bootstrap arithmetic depends on.
 *
 * `minShare` prices the one-off cost MultiVault nets out of a vault's first deposit before any fee
 * is computed; `feeThreshold` decides whether entry and exit fees are charged at all. Both were
 * previously reachable only by indexing the decoded struct at a position that is a property of the
 * Solidity source rather than of anything this package publishes, which is why more than one
 * consumer grew its own copy of this resolution.
 */
export type MultiVaultResolvedGeneralConfig = {
	feeDenominator: bigint;
	minDeposit: bigint;
	minShare: bigint;
	atomDataMaxLength: bigint;
	feeThreshold: bigint;
};

/** Positional indices of the numeric fields of `GeneralConfig`, in declaration order. */
const GENERAL_CONFIG_INDICES = {
	feeDenominator: 2,
	minDeposit: 4,
	minShare: 5,
	atomDataMaxLength: 6,
	feeThreshold: 7,
} as const satisfies Record<keyof MultiVaultResolvedGeneralConfig, number>;

/**
 * Pulls the numeric fields out of `getGeneralConfig`, tolerating both a named-object decode and a
 * positional-tuple decode from viem.
 * @param generalConfigResult The raw result of `multiVaultGetGeneralConfig`.
 * @returns The numeric general-config fields.
 */
export function multiVaultResolveGeneralConfig(
	generalConfigResult: unknown
): MultiVaultResolvedGeneralConfig {
	const resolved = {} as MultiVaultResolvedGeneralConfig;

	for (const [field, index] of Object.entries(GENERAL_CONFIG_INDICES) as Array<
		[keyof MultiVaultResolvedGeneralConfig, number]
	>) {
		let value: unknown;

		if (Array.isArray(generalConfigResult)) {
			value = generalConfigResult[index];
		} else if (typeof generalConfigResult === 'object' && generalConfigResult !== null) {
			const asRecord = generalConfigResult as UnknownRecord;
			value = asRecord[field] ?? asRecord[index];
		}

		if (typeof value !== 'bigint') {
			throw new Error(`Unable to resolve ${field} from getGeneralConfig response.`);
		}
		resolved[field] = value;
	}

	return resolved;
}

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

import { decodeErrorResult, toFunctionSelector } from 'viem';
import { describe, expect, it } from 'vitest';

import { MultiVaultAbi } from './MultiVault-abi';
import { MultiVaultBubbledErrorsAbi, MultiVaultWithRevertsAbi } from './multivault-reverts-abi';

describe('MultiVaultWithRevertsAbi', () => {
	it.each([
		['BondingCurveRegistry_InvalidCurveId', 'BondingCurveRegistry_InvalidCurveId()'],
		['BaseCurve_SharesExceedTotalShares', 'BaseCurve_SharesExceedTotalShares()'],
		['DynamicFeeFlatPriceCurve_OnlyMultiVault', 'DynamicFeeFlatPriceCurve_OnlyMultiVault()'],
	])('decodes %s, which MultiVaultAbi alone cannot', (errorName, signature) => {
		const data = toFunctionSelector(signature);

		expect(() => decodeErrorResult({ abi: MultiVaultAbi, data })).toThrow();
		expect(decodeErrorResult({ abi: MultiVaultWithRevertsAbi, data }).errorName).toBe(errorName);
	});

	it('adds no error MultiVault already declares', () => {
		const declared = new Set<string>(
			MultiVaultAbi.filter((item) => item.type === 'error').map((item) => item.name)
		);

		expect(MultiVaultBubbledErrorsAbi.some((item) => declared.has(item.name))).toBe(false);
	});
});

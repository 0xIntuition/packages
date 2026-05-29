import { describe, expect, it } from 'vitest';
import {
	multiVaultResolveDefaultCurveId,
	multiVaultResolveVaultTotals,
} from './resolve-read-results';

describe('multiVault read result resolvers', () => {
	it('resolves default curve IDs from tuple and object shapes', () => {
		expect(multiVaultResolveDefaultCurveId(['registry', 3n])).toBe(3n);
		expect(multiVaultResolveDefaultCurveId({ defaultCurveId: 7n })).toBe(7n);
		expect(multiVaultResolveDefaultCurveId({ 1: 9n })).toBe(9n);
	});

	it('throws for invalid default curve config shapes', () => {
		expect(() => multiVaultResolveDefaultCurveId({ defaultCurveId: '7' })).toThrow(
			'Unable to resolve default curve ID from bonding curve config.'
		);
	});

	it('resolves vault totals from tuple and object shapes', () => {
		expect(multiVaultResolveVaultTotals([12n, 4n])).toEqual({
			totalAssets: 12n,
			totalShares: 4n,
		});
		expect(multiVaultResolveVaultTotals({ totalAssets: 99n, totalShares: 33n })).toEqual({
			totalAssets: 99n,
			totalShares: 33n,
		});
		expect(multiVaultResolveVaultTotals({ 0: 7n, 1: 2n })).toEqual({
			totalAssets: 7n,
			totalShares: 2n,
		});
	});

	it('throws for invalid vault result shapes', () => {
		expect(() => multiVaultResolveVaultTotals({ totalAssets: 1n, totalShares: '2' })).toThrow(
			'Unable to resolve vault totals from getVault response.'
		);
	});
});

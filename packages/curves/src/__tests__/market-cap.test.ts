import { describe, expect, it } from 'vitest';
import { linearCurrentPrice } from '../linear-curve';
import { marketCapFromState } from '../market-cap';
import { WAD } from '../math';
import { offsetProgressiveCurrentPrice } from '../offset-progressive-curve';
import { progressiveCurrentPrice } from '../progressive-curve';
import type { CurveState, OffsetProgressiveCurveConfig, ProgressiveCurveConfig } from '../types';

const E18 = WAD;

describe('marketCapFromState', () => {
	it('returns 0 for zero totalShares', () => {
		const state: CurveState = { totalAssets: 10n * E18, totalShares: 0n };
		const result = marketCapFromState(state, linearCurrentPrice);
		expect(result).toBe(0n);
	});

	it('computes market cap for linear curve (1:1)', () => {
		const state: CurveState = {
			totalAssets: 10n * E18,
			totalShares: 10n * E18,
		};
		// Price = 1e18, totalShares = 10e18
		// marketCap = 10e18 * 1e18 / 1e18 = 10e18
		const result = marketCapFromState(state, linearCurrentPrice);
		expect(result).toBe(10n * E18);
	});

	it('computes market cap for linear curve (5:1 ratio)', () => {
		const state: CurveState = {
			totalAssets: 50n * E18,
			totalShares: 10n * E18,
		};
		// Price = 5e18, totalShares = 10e18
		// marketCap = 10e18 * 5e18 / 1e18 = 50e18
		const result = marketCapFromState(state, linearCurrentPrice);
		expect(result).toBe(50n * E18);
	});

	it('computes market cap for progressive curve', () => {
		const config: ProgressiveCurveConfig = { slope: 2n * E18 };
		const state: CurveState = {
			totalAssets: 0n,
			totalShares: 10n * E18,
		};
		// Price = 10e18 * 2e18 / 1e18 = 20e18
		// marketCap = 10e18 * 20e18 / 1e18 = 200e18
		const result = marketCapFromState(state, (s) => progressiveCurrentPrice(s, config));
		expect(result).toBe(200n * E18);
	});

	it('computes market cap for offset-progressive curve', () => {
		const config: OffsetProgressiveCurveConfig = {
			slope: 2n * E18,
			offset: 1n * E18,
		};
		const state: CurveState = {
			totalAssets: 0n,
			totalShares: 2n * E18,
		};
		// Price = (2e18 + 1e18) * 2e18 / 1e18 = 6e18
		// marketCap = 2e18 * 6e18 / 1e18 = 12e18
		const result = marketCapFromState(state, (s) => offsetProgressiveCurrentPrice(s, config));
		expect(result).toBe(12n * E18);
	});

	it('returns 0 for empty state with linear curve', () => {
		const state: CurveState = { totalAssets: 0n, totalShares: 0n };
		// Price = 1e18 (1:1 default), totalShares = 0
		// marketCap = 0 * 1e18 / 1e18 = 0
		const result = marketCapFromState(state, linearCurrentPrice);
		expect(result).toBe(0n);
	});
});

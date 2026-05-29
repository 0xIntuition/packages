import { describe, expect, it } from 'vitest';

import {
	linearCurveConvertToAssets,
	linearCurveConvertToShares,
	linearCurveCurrentPrice,
	offsetProgressiveCurveConvertToAssets,
	offsetProgressiveCurveConvertToShares,
	offsetProgressiveCurveCurrentPrice,
	progressiveCurveConvertToAssets,
	progressiveCurveConvertToShares,
	progressiveCurveCurrentPrice,
} from './index';

const E18 = 10n ** 18n;

describe('core/curves helpers', () => {
	it('linear helpers follow expected proportional math', () => {
		const state = { totalAssets: 50n * E18, totalShares: 10n * E18 };
		const shares = linearCurveConvertToShares(5n * E18, state);
		expect(shares).toBe(1n * E18);
		expect(linearCurveConvertToAssets(shares, state)).toBe(5n * E18);
		expect(linearCurveCurrentPrice(state)).toBe(5n * E18);
	});

	it('progressive helpers convert assets and shares with slope-based pricing', () => {
		const state = { totalAssets: 0n, totalShares: 3n * E18 };
		const config = { slope: 2n * E18 };
		const assets = 4n * E18;

		const mintedShares = progressiveCurveConvertToShares(assets, state, config);
		expect(mintedShares).toBeGreaterThan(0n);

		const redeemedAssets = progressiveCurveConvertToAssets(mintedShares, state, config);
		expect(redeemedAssets).toBeLessThanOrEqual(assets);
		expect(progressiveCurveCurrentPrice(state, config)).toBe(6n * E18);
	});

	it('offset progressive helpers include offset in pricing', () => {
		const state = { totalAssets: 0n, totalShares: 2n * E18 };
		const config = { slope: 2n * E18, offset: 1n * E18 };
		const assets = 4n * E18;

		const mintedShares = offsetProgressiveCurveConvertToShares(assets, state, config);
		expect(mintedShares).toBeGreaterThan(0n);

		const redeemedAssets = offsetProgressiveCurveConvertToAssets(mintedShares, state, config);
		expect(redeemedAssets).toBeLessThanOrEqual(assets);
		expect(offsetProgressiveCurveCurrentPrice(state, config)).toBe(6n * E18);
	});
});

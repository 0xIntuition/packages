import { describe, expect, it } from 'vitest';

import * as trustBonding from './index';

describe('core/trustbonding index exports', () => {
	it('exports trustbonding helpers', () => {
		expect(typeof trustBonding.trustBondingCurrentEpoch).toBe('function');
		expect(typeof trustBonding.trustBondingTotalLocked).toBe('function');
		expect(typeof trustBonding.trustBondingGetUserInfo).toBe('function');
		expect(typeof trustBonding.trustBondingGetSystemApy).toBe('function');
		expect(typeof trustBonding.trustBondingGetUserRewardsForEpoch).toBe('function');
		expect(typeof trustBonding.trustBondingHasClaimedRewardsForEpoch).toBe('function');
		expect(typeof trustBonding.trustBondingClaimRewards).toBe('function');
		expect(typeof trustBonding.trustBondingCreateLock).toBe('function');
		expect(typeof trustBonding.trustBondingBalanceOf).toBe('function');
	});
});

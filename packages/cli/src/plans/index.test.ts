import { describe, expect, it } from 'vitest';

import * as plans from './index';

describe('plans index', () => {
	it('re-exports all high-level plan builders', () => {
		expect(typeof plans.buildBaseERC20BridgeToIntuitionPlan).toBe('function');
		expect(typeof plans.buildBaseTrustBridgeToIntuitionPlan).toBe('function');
		expect(typeof plans.buildIntuitionERC20BridgeToBasePlan).toBe('function');
		expect(typeof plans.buildIntuitionTrustBridgeToBasePlan).toBe('function');
		expect(typeof plans.buildMultiVaultCreateAndSeedPlan).toBe('function');
		expect(typeof plans.buildMultiVaultDepositPlan).toBe('function');
		expect(typeof plans.buildMultiVaultRedeemPlan).toBe('function');
		expect(typeof plans.buildTrustBondingClaimAndRestakePlan).toBe('function');
		expect(typeof plans.buildTrustBondingClaimPlan).toBe('function');
		expect(typeof plans.buildTrustBondingLockPlan).toBe('function');
	});
});

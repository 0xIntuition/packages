import { describe, expect, it } from 'vitest';

import * as cli from './index';

describe('package index', () => {
	it('re-exports plan builders from the package entrypoint', () => {
		expect(typeof cli.buildBaseERC20BridgeToIntuitionPlan).toBe('function');
		expect(typeof cli.buildBaseTrustBridgeToIntuitionPlan).toBe('function');
		expect(typeof cli.buildIntuitionERC20BridgeToBasePlan).toBe('function');
		expect(typeof cli.buildIntuitionTrustBridgeToBasePlan).toBe('function');
		expect(typeof cli.buildMultiVaultDepositPlan).toBe('function');
		expect(typeof cli.buildMultiVaultRedeemPlan).toBe('function');
		expect(typeof cli.buildMultiVaultCreateAndSeedPlan).toBe('function');
		expect(typeof cli.buildTrustBondingClaimPlan).toBe('function');
		expect(typeof cli.buildTrustBondingLockPlan).toBe('function');
		expect(typeof cli.buildTrustBondingClaimAndRestakePlan).toBe('function');
	});
});

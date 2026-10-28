import {
	trustBondingClaimAndRestakeEnvelope,
	trustBondingClaimEnvelope,
	trustBondingLockEnvelope,
} from '@0xintuition/sdk/actions';

export type {
	BuildTrustBondingClaimAndRestakePlanInputs,
	BuildTrustBondingClaimPlanInputs,
	BuildTrustBondingLockPlanInputs,
} from '@0xintuition/sdk/actions';

/** @deprecated Use trustBondingClaimEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildTrustBondingClaimPlan = trustBondingClaimEnvelope;

/** @deprecated Use trustBondingLockEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildTrustBondingLockPlan = trustBondingLockEnvelope;

/** @deprecated Use trustBondingClaimAndRestakeEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildTrustBondingClaimAndRestakePlan = trustBondingClaimAndRestakeEnvelope;

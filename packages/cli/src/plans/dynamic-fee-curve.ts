import {
	dynamicFeeCurveClaimEnvelope,
	dynamicFeeCurveDepositEnvelope,
} from '@0xintuition/sdk/actions';

export type {
	BuildDynamicFeeCurveClaimPlanInputs,
	BuildDynamicFeeCurveDepositPlanInputs,
	DynamicFeeCurveClaimPlanReadContext,
	DynamicFeeCurveDepositPlanReadContext,
	DynamicFeeCurvePlanConfig,
	DynamicFeeCurveTierOverrideRead,
} from '@0xintuition/sdk/actions';

/** @deprecated Use dynamicFeeCurveDepositEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildDynamicFeeCurveDepositPlan = dynamicFeeCurveDepositEnvelope;

/** @deprecated Use dynamicFeeCurveClaimEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildDynamicFeeCurveClaimPlan = dynamicFeeCurveClaimEnvelope;

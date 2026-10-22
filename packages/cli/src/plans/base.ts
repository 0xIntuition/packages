import {
	baseERC20BridgeToIntuitionEnvelope,
	baseTrustBridgeToIntuitionEnvelope,
	intuitionERC20BridgeToBaseEnvelope,
	intuitionTrustBridgeToBaseEnvelope,
} from '@0xintuition/sdk/actions';

export type {
	ApprovalBridgePlanReadContext,
	BaseTrustBridgePlanReadContext,
	BridgeFeeReadContext,
	BuildBaseERC20BridgeToIntuitionPlanInputs,
	BuildBaseTrustBridgeToIntuitionPlanInputs,
	BuildIntuitionERC20BridgeToBasePlanInputs,
	BuildIntuitionTrustBridgeToBasePlanInputs,
} from '@0xintuition/sdk/actions';

/** @deprecated Use baseTrustBridgeToIntuitionEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildBaseTrustBridgeToIntuitionPlan = baseTrustBridgeToIntuitionEnvelope;

/** @deprecated Use intuitionTrustBridgeToBaseEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildIntuitionTrustBridgeToBasePlan = intuitionTrustBridgeToBaseEnvelope;

/** @deprecated Use baseERC20BridgeToIntuitionEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildBaseERC20BridgeToIntuitionPlan = baseERC20BridgeToIntuitionEnvelope;

/** @deprecated Use intuitionERC20BridgeToBaseEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildIntuitionERC20BridgeToBasePlan = intuitionERC20BridgeToBaseEnvelope;

import {
	multiVaultCreateAndSeedEnvelope,
	multiVaultDepositEnvelope,
	multiVaultMulticallEnvelope,
	multiVaultOnBehalfOfCreationEnvelope,
	multiVaultRedeemEnvelope,
} from '@0xintuition/sdk/actions';

export type {
	BuildMultiVaultCreateAndSeedPlanInputs,
	BuildMultiVaultDepositPlanInputs,
	BuildMultiVaultMulticallPlanInputs,
	BuildMultiVaultOnBehalfOfCreationPlanInputs,
	BuildMultiVaultRedeemPlanInputs,
	MultiVaultCreateAtomPlanInput,
	MultiVaultCreatePlanReadContext,
	MultiVaultCreateTriplePlanInput,
	MultiVaultDepositPlanReadContext,
	MultiVaultMulticallSubCallPlanInput,
	MultiVaultOnBehalfOfAtomPlanInput,
	MultiVaultOnBehalfOfTriplePlanInput,
	MultiVaultRedeemPlanReadContext,
	MultiVaultSeedDepositPlanInput,
} from '@0xintuition/sdk/actions';

/** @deprecated Use multiVaultDepositEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildMultiVaultDepositPlan = multiVaultDepositEnvelope;

/** @deprecated Use multiVaultRedeemEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildMultiVaultRedeemPlan = multiVaultRedeemEnvelope;

/** @deprecated Use multiVaultCreateAndSeedEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildMultiVaultCreateAndSeedPlan = multiVaultCreateAndSeedEnvelope;

/** @deprecated Use multiVaultOnBehalfOfCreationEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildMultiVaultOnBehalfOfCreationPlan = multiVaultOnBehalfOfCreationEnvelope;

/** @deprecated Use multiVaultMulticallEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildMultiVaultMulticallPlan = multiVaultMulticallEnvelope;

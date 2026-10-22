import { feeProxyCreateAtomsWithUrisEnvelope } from '@0xintuition/sdk/actions';

export type {
	BuildFeeProxyCreateAtomsWithUrisPlanInputs,
	FeeProxyCreateAtomsWithUrisPlanReadContext,
	FeeProxyFeeGuardPlanInput,
} from '@0xintuition/sdk/actions';

/** @deprecated Use feeProxyCreateAtomsWithUrisEnvelope from @0xintuition/sdk/actions. Removed after one release. */
export const buildFeeProxyCreateAtomsWithUrisPlan = feeProxyCreateAtomsWithUrisEnvelope;

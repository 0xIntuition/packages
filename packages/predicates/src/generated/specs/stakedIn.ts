import type { PredicateSpec } from '../../types.js';

export const stakedIn = {
	key: 'stakedIn',
	name: 'staked in',
	description:
		'The subject has committed assets or stake in the object protocol, validator, or staking pool',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Economic/Market',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;

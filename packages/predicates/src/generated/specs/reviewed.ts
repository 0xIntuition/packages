import type { PredicateSpec } from '../../types.js';

export const reviewed = {
	key: 'reviewed',
	name: 'reviewed',
	description: 'The subject has authored a review or evaluation of the object',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Social/Reputation',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'event',
	claimType: 'evaluative',
	inverse: 'reviewedBy',
} as const satisfies PredicateSpec;

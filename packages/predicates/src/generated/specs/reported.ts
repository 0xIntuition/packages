import type { PredicateSpec } from '../../types.js';

export const reported = {
	key: 'reported',
	name: 'reported',
	description: 'The subject has flagged the object for policy violation, spam, or harmful content',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Social/Reputation',
	status: 'proposed',
	objectKind: 'entity',
	polarity: 'negative',
	temporalNature: 'event',
	claimType: 'evaluative',
} as const satisfies PredicateSpec;

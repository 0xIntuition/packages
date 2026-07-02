import type { PredicateSpec } from '../../types.js';

export const reviewedBy = {
	key: 'reviewedBy',
	name: 'reviewed by',
	description: 'The subject page or work was reviewed by the object person or organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Social/Reputation',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'event',
	claimType: 'evaluative',
	inverse: 'reviewed',
} as const satisfies PredicateSpec;

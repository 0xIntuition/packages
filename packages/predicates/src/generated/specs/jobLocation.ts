import type { PredicateSpec } from '../../types.js';

export const jobLocation = {
	key: 'jobLocation',
	name: 'job location',
	description: 'The subject job posting is located at or associated with the object place',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;

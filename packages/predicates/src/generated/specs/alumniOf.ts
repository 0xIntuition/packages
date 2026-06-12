import type { PredicateSpec } from '../../types.js';

export const alumniOf = {
	key: 'alumniOf',
	name: 'alumni of',
	description: 'The subject person is an alumnus of the object organization',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
} as const satisfies PredicateSpec;

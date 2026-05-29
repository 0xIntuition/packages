import type { PredicateSpec } from '../../types.js';

export const employedBy = {
	key: 'employedBy',
	name: 'employed by',
	description: 'The subject person is employed by the object organization',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
} as const satisfies PredicateSpec;

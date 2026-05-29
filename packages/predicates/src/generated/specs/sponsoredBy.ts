import type { PredicateSpec } from '../../types.js';

export const sponsoredBy = {
	key: 'sponsoredBy',
	name: 'sponsored by',
	description:
		'The subject event, project, or initiative receives financial sponsorship from the object entity',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Economic/Market',
	status: 'proposed',
} as const satisfies PredicateSpec;

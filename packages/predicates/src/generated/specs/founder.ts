import type { PredicateSpec } from '../../types.js';

export const founder = {
	key: 'founder',
	name: 'founder',
	description:
		'The subject organization or business was founded by the object person or organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
} as const satisfies PredicateSpec;

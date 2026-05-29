import type { PredicateSpec } from '../../types.js';

export const partnerOf = {
	key: 'partnerOf',
	name: 'partner of',
	description: 'The subject and object have a formal or recognized partnership relationship',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	isSymmetric: true,
} as const satisfies PredicateSpec;

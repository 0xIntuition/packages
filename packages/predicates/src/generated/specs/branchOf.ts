import type { PredicateSpec } from '../../types.js';

export const branchOf = {
	key: 'branchOf',
	name: 'branch of',
	description: 'The subject local business is a branch of the object organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	isHierarchical: true,
} as const satisfies PredicateSpec;

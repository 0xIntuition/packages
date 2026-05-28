import type { PredicateSpec } from '../../types.js';

export const listedIn = {
	key: 'listedIn',
	name: 'listed in',
	description:
		'The subject item appears as an entry within the object collection, stack, or curated list',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'enshrined',
	isHierarchical: true,
	inversePredicate: 'contain',
} as const satisfies PredicateSpec;

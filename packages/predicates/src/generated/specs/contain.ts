import type { PredicateSpec } from '../../types.js';

export const contain = {
	key: 'contain',
	name: 'contain',
	description: 'The subject collection or container includes the object as a member or entry',
	marketPattern: 'attributive',
	conjugates: true,
	thirdPerson: 'contains',
	category: 'Curation/Containment',
	status: 'enshrined',
	isHierarchical: true,
	inversePredicate: 'listed in',
} as const satisfies PredicateSpec;

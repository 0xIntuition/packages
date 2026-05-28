import type { PredicateSpec } from '../../types.js';

export const dependOn = {
	key: 'dependOn',
	name: 'depend on',
	description: 'The subject requires or relies on the object to function or exist',
	marketPattern: 'attributive',
	conjugates: true,
	thirdPerson: 'depends on',
	category: 'Curation/Containment',
	status: 'proposed',
	isTransitive: true,
} as const satisfies PredicateSpec;

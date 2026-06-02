import type { PredicateSpec } from '../../types.js';

export const containedInPlace = {
	key: 'containedInPlace',
	name: 'contained in place',
	description: 'The subject place or local business is contained within the object place',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isTransitive: true,
	isHierarchical: true,
	inversePredicate: 'contains place',
	relationships: {
		location: {
			direction: 'out',
			expectedObjectTypes: ['location'],
			schemaOrgProperty: 'containedInPlace',
		},
		'local-business': {
			direction: 'out',
			expectedObjectTypes: ['location'],
			schemaOrgProperty: 'containedInPlace',
		},
	},
} as const satisfies PredicateSpec;

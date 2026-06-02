import type { PredicateSpec } from '../../types.js';

export const containsPlace = {
	key: 'containsPlace',
	name: 'contains place',
	description: 'The subject place contains the object place or local business',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isTransitive: true,
	isHierarchical: true,
	inversePredicate: 'contained in place',
	relationships: {
		location: {
			direction: 'out',
			expectedObjectTypes: ['location', 'local-business'],
			schemaOrgProperty: 'containsPlace',
		},
		'local-business': {
			direction: 'out',
			expectedObjectTypes: ['location'],
			schemaOrgProperty: 'containsPlace',
		},
	},
} as const satisfies PredicateSpec;

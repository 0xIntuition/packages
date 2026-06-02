import type { PredicateSpec } from '../../types.js';

export const parentOrganization = {
	key: 'parentOrganization',
	name: 'parent organization',
	description: 'The subject organization is a child or subsidiary of the object organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	isTransitive: true,
	isHierarchical: true,
	inversePredicate: 'sub organization',
	relationships: {
		company: {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'parentOrganization',
		},
		'local-business': {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'parentOrganization',
		},
	},
} as const satisfies PredicateSpec;

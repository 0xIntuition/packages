import type { PredicateSpec } from '../../types.js';

export const subOrganization = {
	key: 'subOrganization',
	name: 'sub organization',
	description: 'The subject organization has the object organization as a child or subsidiary',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	isTransitive: true,
	isHierarchical: true,
	inversePredicate: 'parent organization',
	relationships: {
		company: {
			direction: 'out',
			expectedObjectTypes: ['company', 'local-business'],
			schemaOrgProperty: 'subOrganization',
		},
	},
} as const satisfies PredicateSpec;

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
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
	inverse: 'subOrganization',
} as const satisfies PredicateSpec;

import type { PredicateSpec } from '../../types.js';

export const locatedIn = {
	key: 'locatedIn',
	name: 'located in',
	description:
		'Asserts that the subject is geographically or logically situated within the object location',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	isTransitive: true,
	isHierarchical: true,
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;

import type { PredicateSpec } from '../../types.js';

export const superEvent = {
	key: 'superEvent',
	name: 'super event',
	description: 'The subject event is part of the object event',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isTransitive: true,
	isHierarchical: true,
	inversePredicate: 'sub event',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
	inverse: 'subEvent',
} as const satisfies PredicateSpec;

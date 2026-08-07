import type { PredicateSpec } from '../../types.js';

export const subEvent = {
	key: 'subEvent',
	name: 'sub event',
	description: 'The subject event contains the object event as a sub-event',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isTransitive: true,
	isHierarchical: true,
	inversePredicate: 'super event',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
	inverse: 'superEvent',
} as const satisfies PredicateSpec;

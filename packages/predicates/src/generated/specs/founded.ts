import type { PredicateSpec } from '../../types.js';

export const founded = {
	key: 'founded',
	name: 'founded',
	description: 'The subject actor established or co-founded the object organization or project',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	inversePredicate: 'founder',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
	inverse: 'founder',
	specializes: ['affiliatedWith'],
} as const satisfies PredicateSpec;

import type { PredicateSpec } from '../../types.js';

export const actor = {
	key: 'actor',
	name: 'actor',
	description: 'The subject creative work features the object actor or performing group',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;

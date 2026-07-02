import type { PredicateSpec } from '../../types.js';

export const director = {
	key: 'director',
	name: 'director',
	description: 'The subject media work was directed by the object person',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;

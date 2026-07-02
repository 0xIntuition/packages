import type { PredicateSpec } from '../../types.js';

export const use = {
	key: 'use',
	name: 'use',
	description:
		'The subject utilizes, integrates, or depends on the object tool, technology, or resource',
	marketPattern: 'attributive',
	conjugates: true,
	thirdPerson: 'uses',
	category: 'Domain-Specific',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;

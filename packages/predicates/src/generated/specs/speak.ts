import type { PredicateSpec } from '../../types.js';

export const speak = {
	key: 'speak',
	name: 'speak',
	description:
		'The subject has proficiency in the object language, programming language, or communication system',
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'speaks',
	category: 'Knowledge/Expertise',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;

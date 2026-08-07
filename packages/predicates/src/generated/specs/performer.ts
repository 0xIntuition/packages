import type { PredicateSpec } from '../../types.js';

export const performer = {
	key: 'performer',
	name: 'performer',
	description: 'The subject event or creative work includes the object performer',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;

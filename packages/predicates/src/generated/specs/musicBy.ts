import type { PredicateSpec } from '../../types.js';

export const musicBy = {
	key: 'musicBy',
	name: 'music by',
	description: 'The subject media work includes music by the object person or music group',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;

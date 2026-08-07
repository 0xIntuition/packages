import type { PredicateSpec } from '../../types.js';

export const teach = {
	key: 'teach',
	name: 'teach',
	description: 'The subject actively disseminates knowledge about the object topic or skill',
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'teaches',
	category: 'Knowledge/Expertise',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;

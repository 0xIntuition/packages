import type { PredicateSpec } from '../../types.js';

export const agreeWith = {
	key: 'agreeWith',
	name: 'agree with',
	description: "The subject's position aligns with the object claim, proposal, or stance",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'agrees with',
	category: 'Sentiment/Opinion',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'state',
	claimType: 'evaluative',
	contradicts: ['disagreeWith'],
} as const satisfies PredicateSpec;

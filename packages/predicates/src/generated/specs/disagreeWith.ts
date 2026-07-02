import type { PredicateSpec } from '../../types.js';

export const disagreeWith = {
	key: 'disagreeWith',
	name: 'disagree with',
	description: "The subject's position opposes the object claim, proposal, or stance",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'disagrees with',
	category: 'Sentiment/Opinion',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'negative',
	temporalNature: 'state',
	claimType: 'evaluative',
	contradicts: ['agreeWith'],
} as const satisfies PredicateSpec;

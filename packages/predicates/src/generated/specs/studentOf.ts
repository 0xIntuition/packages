import type { PredicateSpec } from '../../types.js';

export const studentOf = {
	key: 'studentOf',
	name: 'student of',
	description:
		"The subject is learning from or apprenticed under the object person or institution. The inverse of 'mentor of'",
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Knowledge/Expertise',
	status: 'proposed',
	inversePredicate: 'mentor of',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
	inverse: 'mentorOf',
	specializes: ['learnedFrom'],
} as const satisfies PredicateSpec;

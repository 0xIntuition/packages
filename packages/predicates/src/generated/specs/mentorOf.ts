import type { PredicateSpec } from '../../types.js';

export const mentorOf = {
	key: 'mentorOf',
	name: 'mentor of',
	description: 'The subject provides ongoing guidance and mentorship to the object person',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Knowledge/Expertise',
	status: 'proposed',
	inversePredicate: 'student of',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
	inverse: 'studentOf',
} as const satisfies PredicateSpec;

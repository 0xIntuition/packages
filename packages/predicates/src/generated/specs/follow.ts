import { I_SUBJECT_ID } from '../../i-atom.js';
import type { PredicateSpec } from '../../types.js';

export const follow = {
	key: 'follow',
	name: 'follow',
	description:
		'The subject chooses to subscribe to or track updates from the object entity. Unidirectional and non-reciprocal',
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'follows',
	category: 'Social/Reputation',
	status: 'enshrined',
	behavior: {
		canonicalDirection: 'subject-to-object',
		subjectRole: 'first-person actor placeholder',
		objectRole: 'followed target',
		relationshipShape: 'one-to-many',
		expectedSubject: {
			kind: 'atom',
			id: I_SUBJECT_ID,
			label: 'canonical I atom',
		},
		expectedObject: {
			kind: 'any',
			reason: 'Any entity can be the target of a follow claim.',
		},
		actor: { required: true, source: 'position', role: 'follower' },
		display: {
			forward: 'follows',
			reverse: 'is followed by',
			thirdPerson: 'follows',
		},
	},
} as const satisfies PredicateSpec;

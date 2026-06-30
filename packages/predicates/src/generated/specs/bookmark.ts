import type { PredicateSpec } from '../../types.js';

export const bookmark = {
	key: 'bookmark',
	name: 'bookmark',
	description: 'The subject account saves the object target for later reference or curation.',
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'bookmarks',
	category: 'Curation/Containment',
	status: 'proposed',
	behavior: {
		canonicalDirection: 'subject-to-object',
		subjectRole: 'bookmarker',
		objectRole: 'bookmarked target',
		relationshipShape: 'many-to-many',
		expectedSubject: {
			kind: 'classification',
			slugs: ['ethereum-account', 'person', 'social-media-account'],
			label: 'account or person doing the bookmarking',
		},
		expectedObject: {
			kind: 'any',
			reason: 'Bookmarks can target notes, claims, stacks, posts, or imported entities.',
		},
		actor: { required: true, source: 'subject', role: 'bookmarker' },
		display: {
			forward: 'bookmarks',
			reverse: 'is bookmarked by',
			thirdPerson: 'bookmarks',
		},
	},
} as const satisfies PredicateSpec;

import type { PredicateSpec } from '../../types.js';

export const inPlaylist = {
	key: 'inPlaylist',
	name: 'in playlist',
	description: 'The subject music recording appears in the object music playlist',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	behavior: {
		canonicalDirection: 'subject-to-object',
		subjectRole: 'music recording',
		objectRole: 'playlist containing the recording',
		relationshipShape: 'many-to-many',
		expectedSubject: {
			kind: 'classification',
			slugs: ['music-recording'],
			label: 'music recording',
		},
		expectedObject: {
			kind: 'schema',
			context: 'https://schema.org/',
			type: 'MusicPlaylist',
			label: 'music playlist',
		},
		actor: { required: false, source: 'statement', role: 'playlist membership attestor' },
		display: {
			forward: 'in playlist',
			reverse: 'contains track',
		},
	},
} as const satisfies PredicateSpec;

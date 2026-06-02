import type { PredicateSpec } from '../../types.js';

export const inPlaylist = {
	key: 'inPlaylist',
	name: 'in playlist',
	description: 'The subject music recording appears in the object music playlist',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	relationships: {
		'music-recording': {
			direction: 'out',
			expectedObjectTypes: ['MusicPlaylist'],
			schemaOrgProperty: 'inPlaylist',
		},
	},
} as const satisfies PredicateSpec;

import type { PredicateSpec } from '../../types.js';

export const director = {
	key: 'director',
	name: 'director',
	description: 'The subject media work was directed by the object person',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	relationships: {
		movie: {
			direction: 'out',
			expectedObjectTypes: ['person'],
			schemaOrgProperty: 'director',
		},
		'podcast-episode': {
			direction: 'out',
			expectedObjectTypes: ['person'],
			schemaOrgProperty: 'director',
		},
		'tv-series': {
			direction: 'out',
			expectedObjectTypes: ['person'],
			schemaOrgProperty: 'director',
		},
		'video-object': {
			direction: 'out',
			expectedObjectTypes: ['person'],
			schemaOrgProperty: 'director',
		},
	},
} as const satisfies PredicateSpec;

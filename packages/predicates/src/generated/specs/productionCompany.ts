import type { PredicateSpec } from '../../types.js';

export const productionCompany = {
	key: 'productionCompany',
	name: 'production company',
	description: 'The subject media work was produced by the object organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	relationships: {
		movie: {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'productionCompany',
		},
		'podcast-episode': {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'productionCompany',
		},
		'tv-series': {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'productionCompany',
		},
		'video-object': {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'productionCompany',
		},
	},
} as const satisfies PredicateSpec;

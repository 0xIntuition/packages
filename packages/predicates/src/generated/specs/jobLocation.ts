import type { PredicateSpec } from '../../types.js';

export const jobLocation = {
	key: 'jobLocation',
	name: 'job location',
	description: 'The subject job posting is located at or associated with the object place',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	relationships: {
		'job-posting': {
			direction: 'out',
			expectedObjectTypes: ['location', 'local-business'],
			schemaOrgProperty: 'jobLocation',
		},
	},
} as const satisfies PredicateSpec;

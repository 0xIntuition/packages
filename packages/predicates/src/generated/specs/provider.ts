import type { PredicateSpec } from '../../types.js';

export const provider = {
	key: 'provider',
	name: 'provider',
	description:
		'The subject service, software, or creative work is provided by the object person or organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	relationships: {
		service: {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'provider',
		},
		'software-application': {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'provider',
		},
		'mobile-application': {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'provider',
		},
	},
} as const satisfies PredicateSpec;

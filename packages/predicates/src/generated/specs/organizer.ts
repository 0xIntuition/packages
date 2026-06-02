import type { PredicateSpec } from '../../types.js';

export const organizer = {
	key: 'organizer',
	name: 'organizer',
	description: 'The subject event is organized by the object person or organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	relationships: {
		event: {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'organizer',
		},
	},
} as const satisfies PredicateSpec;

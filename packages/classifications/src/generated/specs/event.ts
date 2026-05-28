import type { ClassificationSpec } from '../../types.js';

export const event: ClassificationSpec = {
	slug: 'event',
	type: 'Event',
	displayName: 'Event',
	description: 'An event identity with optional time and location disambiguators.',
	category: 'Other',
	schemaOrg: { context: 'https://schema.org/', type: 'Event' },
	fields: [
		{
			key: 'name',
			label: 'Event Name',
			description: 'The name of the event.',
			fieldType: 'string',
			required: true,
			placeholder: 'ETHDenver 2026',
		},
		{
			key: 'startDate',
			label: 'Start Date',
			description: 'The event start date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
		{
			key: 'location',
			label: 'Location',
			description: 'The location name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Denver, Colorado',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same event.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.ethdenver.com',
		},
	],
	defaults: { pluginId: 'event' },
};

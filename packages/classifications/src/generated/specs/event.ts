import type { ClassificationSpec } from '../../types.js';

export const event: ClassificationSpec = {
	slug: 'event',
	type: 'Event',
	displayName: 'Event',
	description: 'An event identity with optional time and location disambiguators.',
	category: 'Other',
	schema: { context: 'https://schema.org/', type: 'Event' },
	metadataPredicates: [
		'organizer',
		'performer',
		'sponsoredBy',
		'subEvent',
		'superEvent',
		'locatedIn',
		'sameAs',
	] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Event Name',
			description: 'The name of the event.',
			fieldType: 'string',
			required: true,
			placeholder: 'ETHDenver 2026',
		},
		{
			key: 'startDate',
			schemaProperty: 'startDate',
			label: 'Start Date',
			description: 'The event start date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
		{
			key: 'location',
			schemaProperty: 'location',
			label: 'Location',
			description: 'The location name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Denver, Colorado',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same event.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.ethdenver.com',
		},
	],
	defaults: { pluginId: 'event' },
	identity: {
		identifies: 'an event occurrence',
		ladder: [
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'url', source: { kind: 'same-as' } },
			{
				kind: 'gen1',
				tag: 3,
				recipe: [
					{ key: 'name', from: 'field' },
					{ key: 'startDate', from: 'field' },
				],
			},
			{ kind: 'gen1', tag: 4, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};

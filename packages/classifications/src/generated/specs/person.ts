import type { ClassificationSpec } from '../../types.js';

export const person: ClassificationSpec = {
	slug: 'person',
	type: 'Person',
	displayName: 'Person',
	description: 'An individual human identity using structured first and last names.',
	category: 'Entity',
	schema: { context: 'https://schema.org/', type: 'Person' },
	metadataPredicates: [
		'memberOf',
		'employedBy',
		'affiliatedWith',
		'alumniOf',
		'sameAs',
		'url',
	] as const,
	fields: [
		{
			key: 'givenName',
			schemaProperty: 'givenName',
			label: 'First Name',
			description: 'The person’s given or first name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Vitalik',
		},
		{
			key: 'familyName',
			schemaProperty: 'familyName',
			label: 'Last Name',
			description: 'The person’s family or last name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Buterin',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same person.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'person', provider: 'wikidata' },
	identity: {
		identifies: 'an individual human',
		ladder: [
			{ kind: 'scheme', scheme: 'isni', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{
				kind: 'gen1',
				tag: 4,
				recipe: [
					{ key: 'givenName', from: 'field' },
					{ key: 'familyName', from: 'field' },
				],
			},
			// D25: mononyms
			{ kind: 'gen1', tag: 5, recipe: [{ key: 'givenName', from: 'field' }] },
		],
	},
};

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
	],
	defaults: { pluginId: 'person', provider: 'wikidata' },
};

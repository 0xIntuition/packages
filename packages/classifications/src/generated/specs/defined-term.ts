import type { ClassificationSpec } from '../../types.js';

export const definedTerm: ClassificationSpec = {
	slug: 'defined-term',
	type: 'DefinedTerm',
	displayName: 'Defined Term',
	description: 'A dictionary-style defined term with a short description.',
	category: 'Entity',
	schemaOrg: { context: 'https://schema.org/', type: 'DefinedTerm' },
	fields: [
		{
			key: 'name',
			label: 'Term Name',
			description: 'The defined term name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Knowledge Graph',
		},
		{
			key: 'description',
			label: 'Description',
			description: 'The meaning or definition of the term.',
			fieldType: 'string',
			required: false,
			placeholder: 'Structured, semantic network that organizes data.',
		},
	],
	defaults: { pluginId: 'defined-term', provider: 'dictionary' },
};

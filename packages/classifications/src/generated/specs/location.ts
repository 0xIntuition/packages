import type { ClassificationSpec } from '../../types.js';

export const location: ClassificationSpec = {
	slug: 'location',
	type: 'Place',
	displayName: 'Location',
	description: 'A place identity with optional address and canonical references.',
	category: 'Entity',
	schemaOrg: { context: 'https://schema.org/', type: 'Place' },
	fields: [
		{
			key: 'name',
			label: 'Location Name',
			description: 'The place name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Golden Gate Bridge',
		},
		{
			key: 'address',
			label: 'Address',
			description: 'The address when needed for disambiguation.',
			fieldType: 'string',
			required: false,
			placeholder: 'San Francisco, CA 94129',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same place.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.wikidata.org/wiki/Q474',
		},
	],
	defaults: { pluginId: 'location' },
};

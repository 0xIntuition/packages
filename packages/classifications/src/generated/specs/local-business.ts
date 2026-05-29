import type { ClassificationSpec } from '../../types.js';

export const localBusiness: ClassificationSpec = {
	slug: 'local-business',
	type: 'LocalBusiness',
	displayName: 'Local Business',
	description: 'A local business identity with optional address and contact disambiguators.',
	category: 'Entity',
	schemaOrg: { context: 'https://schema.org/', type: 'LocalBusiness' },
	fields: [
		{
			key: 'name',
			label: 'Business Name',
			description: 'The local business name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Blue Bottle Coffee',
		},
		{
			key: 'address',
			label: 'Address',
			description: 'The street address when needed.',
			fieldType: 'string',
			required: false,
			placeholder: '66 Mint St, San Francisco, CA',
		},
		{
			key: 'telephone',
			label: 'Telephone',
			description: 'A contact telephone number when needed.',
			fieldType: 'string',
			required: false,
			placeholder: '+14152222222',
		},
		{
			key: 'url',
			label: 'Official Website',
			description: 'The official website when available.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://bluebottlecoffee.com',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references for the same business.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://maps.google.com/?cid=example',
		},
	],
	defaults: { pluginId: 'local-business', provider: 'places' },
};

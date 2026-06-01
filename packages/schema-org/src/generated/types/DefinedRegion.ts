import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDefinedRegion = {
	id: 'schema:DefinedRegion',
	name: 'DefinedRegion',
	label: 'DefinedRegion',
	comment:
		'A DefinedRegion is a geographic area defined by potentially arbitrary (rather than political, administrative or natural geographical) criteria. Properties are provided for defining a region by reference to sets of postal codes.\n\nExamples: a delivery destination when shopping. Region where regional pricing is configured.\n\nRequirement 1:\nCountry: US\nStates: "NY", "CA"\n\nRequirement 2:\nCountry: US\nPostalCode Set: { [94000-94585], [97000, 97999], [13000, 13599]}\n{ [12345, 12345], [78945, 78945], }\nRegion = state, canton, prefecture, autonomous community...\n',
	subClassOf: ['Place', 'Thing', 'StructuredValue', 'Intangible'],
	properties: [
		{
			id: 'schema:addressCountry',
			name: 'addressCountry',
			label: 'addressCountry',
			comment:
				'The country. Recommended to be in 2-letter [ISO 3166-1 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1) format, for example "US". For backward compatibility, a 3-letter [ISO 3166-1 alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) country code such as "SGP" or a full country name such as "Singapore" can also be used.',
			rangeIncludes: ['Country', 'Text'],
		},
		{
			id: 'schema:addressRegion',
			name: 'addressRegion',
			label: 'addressRegion',
			comment:
				'The region in which the locality is, and which is in the country. For example, California or another appropriate first-level [Administrative division](https://en.wikipedia.org/wiki/List_of_administrative_divisions_by_country) such as the Province in Italy or Region in Germany.',
			rangeIncludes: ['AdministrativeArea', 'Text'],
		},
		{
			id: 'schema:postalCode',
			name: 'postalCode',
			label: 'postalCode',
			comment: 'The postal code. For example, 94043.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:postalCodePrefix',
			name: 'postalCodePrefix',
			label: 'postalCodePrefix',
			comment:
				'A defined range of postal codes indicated by a common textual prefix. Used for non-numeric systems such as UK.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:postalCodeRange',
			name: 'postalCodeRange',
			label: 'postalCodeRange',
			comment: 'A defined range of postal codes.',
			rangeIncludes: ['PostalCodeRangeSpecification'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDefinedRegion;
export const DefinedRegion = schemaOrgDefinedRegion;

export default schemaOrgDefinedRegion;

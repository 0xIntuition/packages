import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPostalAddress = {
	id: 'schema:PostalAddress',
	name: 'PostalAddress',
	label: 'PostalAddress',
	comment: 'The mailing address.',
	subClassOf: ['ContactPoint', 'StructuredValue', 'Intangible', 'Thing'],
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
			id: 'schema:addressLocality',
			name: 'addressLocality',
			label: 'addressLocality',
			comment:
				'The locality in which the street address is, and which is in the region. For example, Mountain View.',
			rangeIncludes: ['Text'],
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
			id: 'schema:extendedAddress',
			name: 'extendedAddress',
			label: 'extendedAddress',
			comment: 'An address extension such as an apartment number, C/O or alternative name.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:postOfficeBoxNumber',
			name: 'postOfficeBoxNumber',
			label: 'postOfficeBoxNumber',
			comment: 'The post office box number for PO box addresses.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:postalCode',
			name: 'postalCode',
			label: 'postalCode',
			comment: 'The postal code. For example, 94043.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:streetAddress',
			name: 'streetAddress',
			label: 'streetAddress',
			comment: 'The street address. For example, 1600 Amphitheatre Pkwy.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPostalAddress;
export const PostalAddress = schemaOrgPostalAddress;

export default schemaOrgPostalAddress;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGeoCoordinates = {
	id: 'schema:GeoCoordinates',
	name: 'GeoCoordinates',
	label: 'GeoCoordinates',
	comment: 'The geographic coordinates of a place or event.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:address',
			name: 'address',
			label: 'address',
			comment: 'Physical address of the item.',
			rangeIncludes: ['PostalAddress', 'Text'],
		},
		{
			id: 'schema:addressCountry',
			name: 'addressCountry',
			label: 'addressCountry',
			comment:
				'The country. Recommended to be in 2-letter [ISO 3166-1 alpha-2](http://en.wikipedia.org/wiki/ISO_3166-1) format, for example "US". For backward compatibility, a 3-letter [ISO 3166-1 alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) country code such as "SGP" or a full country name such as "Singapore" can also be used.',
			rangeIncludes: ['Country', 'Text'],
		},
		{
			id: 'schema:elevation',
			name: 'elevation',
			label: 'elevation',
			comment:
				"The elevation of a location ([WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)). Values may be of the form 'NUMBER UNIT\\_OF\\_MEASUREMENT' (e.g., '1,000 m', '3,200 ft') while numbers alone should be assumed to be a value in meters.",
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:latitude',
			name: 'latitude',
			label: 'latitude',
			comment:
				'The latitude of a location. For example ```37.42242``` ([WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)).',
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:longitude',
			name: 'longitude',
			label: 'longitude',
			comment:
				'The longitude of a location. For example ```-122.08585``` ([WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)).',
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:postalCode',
			name: 'postalCode',
			label: 'postalCode',
			comment: 'The postal code. For example, 94043.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGeoCoordinates;
export const GeoCoordinates = schemaOrgGeoCoordinates;

export default schemaOrgGeoCoordinates;

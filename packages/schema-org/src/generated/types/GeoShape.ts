import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGeoShape = {
	id: 'schema:GeoShape',
	name: 'GeoShape',
	label: 'GeoShape',
	comment:
		'The geographic shape of a place. A GeoShape can be described using several properties whose values are based on latitude/longitude pairs. Either whitespace or commas can be used to separate latitude and longitude; whitespace should be used when writing a list of several such points.',
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
			id: 'schema:box',
			name: 'box',
			label: 'box',
			comment:
				'A box is the area enclosed by the rectangle formed by two points. The first point is the lower corner, the second point is the upper corner. A box is expressed as two points separated by a space character.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:circle',
			name: 'circle',
			label: 'circle',
			comment:
				'A circle is the circular region of a specified radius centered at a specified latitude and longitude. A circle is expressed as a pair followed by a radius in meters.',
			rangeIncludes: ['Text'],
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
			id: 'schema:line',
			name: 'line',
			label: 'line',
			comment:
				'A line is a point-to-point path consisting of two or more points. A line is expressed as a series of two or more point objects separated by space.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:polygon',
			name: 'polygon',
			label: 'polygon',
			comment:
				'A polygon is the area enclosed by a point-to-point path for which the starting and ending points are the same. A polygon is expressed as a series of four or more space delimited points where the first and final points are identical.',
			rangeIncludes: ['Text'],
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

export const spec = schemaOrgGeoShape;
export const GeoShape = schemaOrgGeoShape;

export default schemaOrgGeoShape;

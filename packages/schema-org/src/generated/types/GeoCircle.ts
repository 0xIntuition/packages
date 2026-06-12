import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGeoCircle = {
	id: 'schema:GeoCircle',
	name: 'GeoCircle',
	label: 'GeoCircle',
	comment:
		"A GeoCircle is a GeoShape representing a circular geographic area. As it is a GeoShape\n          it provides the simple textual property 'circle', but also allows the combination of postalCode alongside geoRadius.\n          The center of the circle can be indicated via the 'geoMidpoint' property, or more approximately using 'address', 'postalCode'.\n       ",
	subClassOf: ['GeoShape', 'StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:geoMidpoint',
			name: 'geoMidpoint',
			label: 'geoMidpoint',
			comment: 'Indicates the GeoCoordinates at the centre of a GeoShape, e.g. GeoCircle.',
			rangeIncludes: ['GeoCoordinates'],
		},
		{
			id: 'schema:geoRadius',
			name: 'geoRadius',
			label: 'geoRadius',
			comment:
				'Indicates the approximate radius of a GeoCircle (metres unless indicated otherwise via Distance notation).',
			rangeIncludes: ['Distance', 'Number', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGeoCircle;
export const GeoCircle = schemaOrgGeoCircle;

export default schemaOrgGeoCircle;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGeospatialGeometry = {
	id: 'schema:GeospatialGeometry',
	name: 'GeospatialGeometry',
	label: 'GeospatialGeometry',
	comment:
		'(Eventually to be defined as) a supertype of GeoShape designed to accommodate definitions from Geo-Spatial best practices.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:geoContains',
			name: 'geoContains',
			label: 'geoContains',
			comment:
				'Represents a relationship between two geometries (or the places they represent), relating a containing geometry to a contained geometry. "a contains b iff no points of b lie in the exterior of a, and at least one point of the interior of b lies in the interior of a". As defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoCoveredBy',
			name: 'geoCoveredBy',
			label: 'geoCoveredBy',
			comment:
				'Represents a relationship between two geometries (or the places they represent), relating a geometry to another that covers it. As defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoCovers',
			name: 'geoCovers',
			label: 'geoCovers',
			comment:
				'Represents a relationship between two geometries (or the places they represent), relating a covering geometry to a covered geometry. "Every point of b is a point of (the interior or boundary of) a". As defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoCrosses',
			name: 'geoCrosses',
			label: 'geoCrosses',
			comment:
				'Represents a relationship between two geometries (or the places they represent), relating a geometry to another that crosses it: "a crosses b: they have some but not all interior points in common, and the dimension of the intersection is less than that of at least one of them". As defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoDisjoint',
			name: 'geoDisjoint',
			label: 'geoDisjoint',
			comment:
				'Represents spatial relations in which two geometries (or the places they represent) are topologically disjoint: "they have no point in common. They form a set of disconnected geometries." (A symmetric relationship, as defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).)',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoEquals',
			name: 'geoEquals',
			label: 'geoEquals',
			comment:
				'Represents spatial relations in which two geometries (or the places they represent) are topologically equal, as defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM). "Two geometries are topologically equal if their interiors intersect and no part of the interior or boundary of one geometry intersects the exterior of the other" (a symmetric relationship).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoIntersects',
			name: 'geoIntersects',
			label: 'geoIntersects',
			comment:
				'Represents spatial relations in which two geometries (or the places they represent) have at least one point in common. As defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoOverlaps',
			name: 'geoOverlaps',
			label: 'geoOverlaps',
			comment:
				'Represents a relationship between two geometries (or the places they represent), relating a geometry to another that geospatially overlaps it, i.e. they have some but not all points in common. As defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoTouches',
			name: 'geoTouches',
			label: 'geoTouches',
			comment:
				'Represents spatial relations in which two geometries (or the places they represent) touch: "they have at least one boundary point in common, but no interior points." (A symmetric relationship, as defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).)',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
		{
			id: 'schema:geoWithin',
			name: 'geoWithin',
			label: 'geoWithin',
			comment:
				'Represents a relationship between two geometries (or the places they represent), relating a geometry to one that contains it, i.e. it is inside (i.e. within) its interior. As defined in [DE-9IM](https://en.wikipedia.org/wiki/DE-9IM).',
			rangeIncludes: ['GeospatialGeometry', 'Place'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGeospatialGeometry;
export const GeospatialGeometry = schemaOrgGeospatialGeometry;

export default schemaOrgGeospatialGeometry;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlace = {
	id: 'schema:Place',
	name: 'Place',
	label: 'Place',
	comment: 'Entities that have a somewhat fixed, physical extension.',
	subClassOf: ['Thing'],
	properties: [
		{
			id: 'schema:additionalProperty',
			name: 'additionalProperty',
			label: 'additionalProperty',
			comment:
				'A property-value pair representing an additional characteristic of the entity, e.g. a product feature or another characteristic for which there is no matching property in schema.org.\\n\\nNote: Publishers should be aware that applications designed to use specific schema.org properties (e.g. https://schema.org/width, https://schema.org/color, https://schema.org/gtin13, ...) will typically expect such data to be provided using those properties, rather than using the generic property/value mechanism.\n',
			rangeIncludes: ['PropertyValue'],
		},
		{
			id: 'schema:address',
			name: 'address',
			label: 'address',
			comment: 'Physical address of the item.',
			rangeIncludes: ['PostalAddress', 'Text'],
		},
		{
			id: 'schema:aggregateRating',
			name: 'aggregateRating',
			label: 'aggregateRating',
			comment: 'The overall rating, based on a collection of reviews or ratings, of the item.',
			rangeIncludes: ['AggregateRating'],
		},
		{
			id: 'schema:amenityFeature',
			name: 'amenityFeature',
			label: 'amenityFeature',
			comment:
				'An amenity feature (e.g. a characteristic or service) of the Accommodation. This generic property does not make a statement about whether the feature is included in an offer for the main accommodation or available at extra costs.',
			rangeIncludes: ['LocationFeatureSpecification'],
		},
		{
			id: 'schema:branchCode',
			name: 'branchCode',
			label: 'branchCode',
			comment:
				'A short textual code (also called "store code") that uniquely identifies a place of business. The code is typically assigned by the parentOrganization and used in structured URLs.\\n\\nFor example, in the URL http://www.starbucks.co.uk/store-locator/etc/detail/3047 the code "3047" is a branchCode for a particular branch.\n      ',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:containedIn',
			name: 'containedIn',
			label: 'containedIn',
			comment: 'The basic containment relation between a place and one that contains it.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:containedInPlace',
			name: 'containedInPlace',
			label: 'containedInPlace',
			comment: 'The basic containment relation between a place and one that contains it.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:containsPlace',
			name: 'containsPlace',
			label: 'containsPlace',
			comment: 'The basic containment relation between a place and another that it contains.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:event',
			name: 'event',
			label: 'event',
			comment: 'Upcoming or past event associated with this place, organization, or action.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:events',
			name: 'events',
			label: 'events',
			comment: 'Upcoming or past events associated with this place or organization.',
			rangeIncludes: ['Event'],
		},
		{
			id: 'schema:faxNumber',
			name: 'faxNumber',
			label: 'faxNumber',
			comment: 'The fax number.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:geo',
			name: 'geo',
			label: 'geo',
			comment: 'The geo coordinates of the place.',
			rangeIncludes: ['GeoCoordinates', 'GeoShape'],
		},
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
		{
			id: 'schema:globalLocationNumber',
			name: 'globalLocationNumber',
			label: 'globalLocationNumber',
			comment:
				'The [Global Location Number](http://www.gs1.org/gln) (GLN, sometimes also referred to as International Location Number or ILN) of the respective organization, person, or place. The GLN is a 13-digit number used to identify parties and physical locations.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:hasCertification',
			name: 'hasCertification',
			label: 'hasCertification',
			comment:
				'Certification information about a product, organization, service, place, or person.',
			rangeIncludes: ['Certification'],
		},
		{
			id: 'schema:hasDriveThroughService',
			name: 'hasDriveThroughService',
			label: 'hasDriveThroughService',
			comment:
				'Indicates whether some facility (e.g. [[FoodEstablishment]], [[CovidTestingFacility]]) offers a service that can be used by driving through in a car. In the case of [[CovidTestingFacility]] such facilities could potentially help with social distancing from other potentially-infected users.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:hasGS1DigitalLink',
			name: 'hasGS1DigitalLink',
			label: 'hasGS1DigitalLink',
			comment:
				'The <a href="https://www.gs1.org/standards/gs1-digital-link">GS1 digital link</a> associated with the object. This URL should conform to the particular requirements of digital links. The link should only contain the Application Identifiers (AIs) that are relevant for the entity being annotated, for instance a [[Product]] or an [[Organization]], and for the correct granularity. In particular, for products:<ul><li>A Digital Link that contains a serial number (AI <code>21</code>) should only be present on instances of [[IndividualProduct]]</li><li>A Digital Link that contains a lot number (AI <code>10</code>) should be annotated as [[SomeProducts]] if only products from that lot are sold, or [[IndividualProduct]] if there is only a specific product.</li><li>A Digital Link that contains a global model number (AI <code>8013</code>) should be attached to a [[Product]] or a [[ProductModel]].</li></ul> Other item types should be adapted similarly.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:hasMap',
			name: 'hasMap',
			label: 'hasMap',
			comment: 'A URL to a map of the place.',
			rangeIncludes: ['Map', 'URL'],
		},
		{
			id: 'schema:isAccessibleForFree',
			name: 'isAccessibleForFree',
			label: 'isAccessibleForFree',
			comment: 'A flag to signal that the item, event, or place is accessible for free.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:isicV4',
			name: 'isicV4',
			label: 'isicV4',
			comment:
				'The International Standard of Industrial Classification of All Economic Activities (ISIC), Revision 4 code for a particular organization, business person, or place.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:keywords',
			name: 'keywords',
			label: 'keywords',
			comment:
				'Keywords or tags used to describe some item. Multiple textual entries in a keywords list are typically delimited by commas, or by repeating the property.',
			rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
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
			id: 'schema:logo',
			name: 'logo',
			label: 'logo',
			comment: 'An associated logo.',
			rangeIncludes: ['ImageObject', 'URL'],
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
			id: 'schema:map',
			name: 'map',
			label: 'map',
			comment: 'A URL to a map of the place.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:maps',
			name: 'maps',
			label: 'maps',
			comment: 'A URL to a map of the place.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:maximumAttendeeCapacity',
			name: 'maximumAttendeeCapacity',
			label: 'maximumAttendeeCapacity',
			comment: 'The total number of individuals that may attend an event or venue.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:openingHoursSpecification',
			name: 'openingHoursSpecification',
			label: 'openingHoursSpecification',
			comment: 'The opening hours of a certain place.',
			rangeIncludes: ['OpeningHoursSpecification'],
		},
		{
			id: 'schema:photo',
			name: 'photo',
			label: 'photo',
			comment: 'A photograph of this place.',
			rangeIncludes: ['ImageObject', 'Photograph'],
		},
		{
			id: 'schema:photos',
			name: 'photos',
			label: 'photos',
			comment: 'Photographs of this place.',
			rangeIncludes: ['ImageObject', 'Photograph'],
		},
		{
			id: 'schema:publicAccess',
			name: 'publicAccess',
			label: 'publicAccess',
			comment:
				'A flag to signal that the [[Place]] is open to public visitors.  If this property is omitted there is no assumed default boolean value.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:review',
			name: 'review',
			label: 'review',
			comment: 'A review of the item.',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:reviews',
			name: 'reviews',
			label: 'reviews',
			comment: 'Review of the item.',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:slogan',
			name: 'slogan',
			label: 'slogan',
			comment: 'A slogan or motto associated with the item.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:smokingAllowed',
			name: 'smokingAllowed',
			label: 'smokingAllowed',
			comment:
				'Indicates whether it is allowed to smoke in the place, e.g. in the restaurant, hotel or hotel room.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:specialOpeningHoursSpecification',
			name: 'specialOpeningHoursSpecification',
			label: 'specialOpeningHoursSpecification',
			comment:
				'The special opening hours of a certain place.\\n\\nUse this to explicitly override general opening hours brought in scope by [[openingHoursSpecification]] or [[openingHours]].\n      ',
			rangeIncludes: ['OpeningHoursSpecification'],
		},
		{
			id: 'schema:telephone',
			name: 'telephone',
			label: 'telephone',
			comment: 'The telephone number.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:tourBookingPage',
			name: 'tourBookingPage',
			label: 'tourBookingPage',
			comment:
				'A page providing information on how to book a tour of some [[Place]], such as an [[Accommodation]] or [[ApartmentComplex]] in a real estate setting, as well as other kinds of tours as appropriate.',
			rangeIncludes: ['URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlace;
export const Place = schemaOrgPlace;

export default schemaOrgPlace;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLodgingBusiness = {
	id: 'schema:LodgingBusiness',
	name: 'LodgingBusiness',
	label: 'LodgingBusiness',
	comment: 'A lodging business, such as a motel, hotel, or inn.',
	subClassOf: ['LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [
		{
			id: 'schema:amenityFeature',
			name: 'amenityFeature',
			label: 'amenityFeature',
			comment:
				'An amenity feature (e.g. a characteristic or service) of the Accommodation. This generic property does not make a statement about whether the feature is included in an offer for the main accommodation or available at extra costs.',
			rangeIncludes: ['LocationFeatureSpecification'],
		},
		{
			id: 'schema:audience',
			name: 'audience',
			label: 'audience',
			comment: 'An intended audience, i.e. a group for whom something was created.',
			rangeIncludes: ['Audience'],
		},
		{
			id: 'schema:availableLanguage',
			name: 'availableLanguage',
			label: 'availableLanguage',
			comment:
				'A language someone may use with or at the item, service or place. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[inLanguage]].',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:checkinTime',
			name: 'checkinTime',
			label: 'checkinTime',
			comment: 'The earliest someone may check into a lodging establishment.',
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:checkoutTime',
			name: 'checkoutTime',
			label: 'checkoutTime',
			comment: 'The latest someone may check out of a lodging establishment.',
			rangeIncludes: ['DateTime', 'Time'],
		},
		{
			id: 'schema:numberOfRooms',
			name: 'numberOfRooms',
			label: 'numberOfRooms',
			comment:
				'The number of rooms (excluding bathrooms and closets) of the accommodation or lodging business.\nTypical unit code(s): ROM for room or C62 for no unit. The type of room can be put in the unitText property of the QuantitativeValue.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:petsAllowed',
			name: 'petsAllowed',
			label: 'petsAllowed',
			comment:
				'Indicates whether pets are allowed to enter the accommodation or lodging business. More detailed information can be put in a text value.',
			rangeIncludes: ['Boolean', 'Text'],
		},
		{
			id: 'schema:starRating',
			name: 'starRating',
			label: 'starRating',
			comment:
				'An official rating for a lodging business or food establishment, e.g. from national associations or standards bodies. Use the author property to indicate the rating organization, e.g. as an Organization with name such as (e.g. HOTREC, DEHOGA, WHR, or Hotelstars).',
			rangeIncludes: ['Rating'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLodgingBusiness;
export const LodgingBusiness = schemaOrgLodgingBusiness;

export default schemaOrgLodgingBusiness;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTouristAttraction = {
	id: 'schema:TouristAttraction',
	name: 'TouristAttraction',
	label: 'TouristAttraction',
	comment:
		'A tourist attraction.  In principle any Thing can be a [[TouristAttraction]], from a [[Mountain]] and [[LandmarksOrHistoricalBuildings]] to a [[LocalBusiness]].  This Type can be used on its own to describe a general [[TouristAttraction]], or be used as an [[additionalType]] to add tourist attraction properties to any other type.  (See examples below)',
	subClassOf: ['Place', 'Thing'],
	properties: [
		{
			id: 'schema:availableLanguage',
			name: 'availableLanguage',
			label: 'availableLanguage',
			comment:
				'A language someone may use with or at the item, service or place. Please use one of the language codes from the [IETF BCP 47 standard](http://tools.ietf.org/html/bcp47). See also [[inLanguage]].',
			rangeIncludes: ['Language', 'Text'],
		},
		{
			id: 'schema:touristType',
			name: 'touristType',
			label: 'touristType',
			comment:
				'Attraction suitable for type(s) of tourist. E.g. children, visitors from a particular country, etc. ',
			rangeIncludes: ['Audience', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTouristAttraction;
export const TouristAttraction = schemaOrgTouristAttraction;

export default schemaOrgTouristAttraction;

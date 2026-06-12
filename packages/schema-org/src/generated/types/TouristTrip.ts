import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTouristTrip = {
	id: 'schema:TouristTrip',
	name: 'TouristTrip',
	label: 'TouristTrip',
	comment:
		'A tourist trip. A created itinerary of visits to one or more places of interest ([[TouristAttraction]]/[[TouristDestination]]) often linked by a similar theme, geographic area, or interest to a particular [[touristType]]. The [UNWTO](http://www2.unwto.org/) defines tourism trip as the Trip taken by visitors.\n  (See examples below.)',
	subClassOf: ['Trip', 'Intangible', 'Thing'],
	properties: [
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

export const spec = schemaOrgTouristTrip;
export const TouristTrip = schemaOrgTouristTrip;

export default schemaOrgTouristTrip;

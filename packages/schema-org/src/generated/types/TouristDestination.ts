import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTouristDestination = {
	id: 'schema:TouristDestination',
	name: 'TouristDestination',
	label: 'TouristDestination',
	comment:
		'A tourist destination. In principle any [[Place]] can be a [[TouristDestination]] from a [[City]], Region or [[Country]] to an [[AmusementPark]] or [[Hotel]]. This Type can be used on its own to describe a general [[TouristDestination]], or be used as an [[additionalType]] to add tourist relevant properties to any other [[Place]].  A [[TouristDestination]] is defined as a [[Place]] that contains, or is colocated with, one or more [[TouristAttraction]]s, often linked by a similar theme or interest to a particular [[touristType]]. The [UNWTO](http://www2.unwto.org/) defines Destination (main destination of a tourism trip) as the place visited that is central to the decision to take the trip.\n  (See examples below.)',
	subClassOf: ['Place', 'Thing'],
	properties: [
		{
			id: 'schema:includesAttraction',
			name: 'includesAttraction',
			label: 'includesAttraction',
			comment: 'Attraction located at destination.',
			rangeIncludes: ['TouristAttraction'],
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

export const spec = schemaOrgTouristDestination;
export const TouristDestination = schemaOrgTouristDestination;

export default schemaOrgTouristDestination;

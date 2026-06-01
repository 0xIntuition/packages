import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOpeningHoursSpecification = {
	id: 'schema:OpeningHoursSpecification',
	name: 'OpeningHoursSpecification',
	label: 'OpeningHoursSpecification',
	comment:
		'A structured value providing information about the opening hours of a place or a certain service inside a place.\\n\\n\nThe place is __open__ if the [[opens]] property is specified, and __closed__ otherwise.\\n\\nIf the value for the [[closes]] property is less than the value for the [[opens]] property then the hour range is assumed to span over the next day.\n      ',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:closes',
			name: 'closes',
			label: 'closes',
			comment: 'The closing hour of the place or service on the given day(s) of the week.',
			rangeIncludes: ['Time'],
		},
		{
			id: 'schema:dayOfWeek',
			name: 'dayOfWeek',
			label: 'dayOfWeek',
			comment: 'The day of the week for which these opening hours are valid.',
			rangeIncludes: ['DayOfWeek'],
		},
		{
			id: 'schema:opens',
			name: 'opens',
			label: 'opens',
			comment: 'The opening hour of the place or service on the given day(s) of the week.',
			rangeIncludes: ['Time'],
		},
		{
			id: 'schema:validFrom',
			name: 'validFrom',
			label: 'validFrom',
			comment: 'The date when the item becomes valid.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:validThrough',
			name: 'validThrough',
			label: 'validThrough',
			comment:
				'The date after when the item is not valid. For example the end of an offer, salary period, or a period of opening hours.',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOpeningHoursSpecification;
export const OpeningHoursSpecification = schemaOrgOpeningHoursSpecification;

export default schemaOrgOpeningHoursSpecification;

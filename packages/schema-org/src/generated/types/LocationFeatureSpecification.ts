import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLocationFeatureSpecification = {
	id: 'schema:LocationFeatureSpecification',
	name: 'LocationFeatureSpecification',
	label: 'LocationFeatureSpecification',
	comment:
		'Specifies a location feature by providing a structured value representing a feature of an accommodation as a property-value pair of varying degrees of formality.',
	subClassOf: ['PropertyValue', 'StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:hoursAvailable',
			name: 'hoursAvailable',
			label: 'hoursAvailable',
			comment: 'The hours during which this service or contact is available.',
			rangeIncludes: ['OpeningHoursSpecification'],
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

export const spec = schemaOrgLocationFeatureSpecification;
export const LocationFeatureSpecification = schemaOrgLocationFeatureSpecification;

export default schemaOrgLocationFeatureSpecification;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgServicePeriod = {
	id: 'schema:ServicePeriod',
	name: 'ServicePeriod',
	label: 'ServicePeriod',
	comment:
		'ServicePeriod represents a duration with some constraints about cutoff time and business days. This is used e.g. in shipping for handling times or transit time.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:businessDays',
			name: 'businessDays',
			label: 'businessDays',
			comment:
				'Days of the week when the merchant typically operates, indicated via opening hours markup.',
			rangeIncludes: ['DayOfWeek', 'OpeningHoursSpecification'],
		},
		{
			id: 'schema:cutoffTime',
			name: 'cutoffTime',
			label: 'cutoffTime',
			comment:
				'Order cutoff time allows merchants to describe the time after which they will no longer process orders received on that day. For orders processed after cutoff time, one day gets added to the delivery time estimate. This property is expected to be most typically used via the [[ShippingRateSettings]] publication pattern. The time is indicated using the ISO-8601 Time format, e.g. "23:30:00-05:00" would represent 6:30 pm Eastern Standard Time (EST) which is 5 hours behind Coordinated Universal Time (UTC).',
			rangeIncludes: ['Time'],
		},
		{
			id: 'schema:duration',
			name: 'duration',
			label: 'duration',
			comment:
				'The duration of the item (movie, audio recording, event, etc.) in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgServicePeriod;
export const ServicePeriod = schemaOrgServicePeriod;

export default schemaOrgServicePeriod;

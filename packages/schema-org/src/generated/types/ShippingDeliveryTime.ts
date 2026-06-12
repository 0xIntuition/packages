import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShippingDeliveryTime = {
	id: 'schema:ShippingDeliveryTime',
	name: 'ShippingDeliveryTime',
	label: 'ShippingDeliveryTime',
	comment:
		'ShippingDeliveryTime provides various pieces of information about delivery times for shipping.',
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
			id: 'schema:handlingTime',
			name: 'handlingTime',
			label: 'handlingTime',
			comment:
				'The typical delay between the receipt of the order and the goods either leaving the warehouse or being prepared for pickup, in case the delivery method is on site pickup.\n\nIn the context of [[ShippingDeliveryTime]], Typical properties: minValue, maxValue, unitCode (d for DAY).  This is by common convention assumed to mean business days (if a unitCode is used, coded as "d"), i.e. only counting days when the business normally operates.\n\nIn the context of [[ShippingService]], use the [[ServicePeriod]] format, that contains the same information in a structured form, with cut-off time, business days and duration.',
			rangeIncludes: ['QuantitativeValue', 'ServicePeriod'],
		},
		{
			id: 'schema:transitTime',
			name: 'transitTime',
			label: 'transitTime',
			comment:
				'The typical delay the order has been sent for delivery and the goods reach the final customer.\n\n  In the context of [[ShippingDeliveryTime]], use the [[QuantitativeValue]]. Typical properties: minValue, maxValue, unitCode (d for DAY).\n\n  In the context of [[ShippingConditions]], use the [[ServicePeriod]]. It has a duration (as a [[QuantitativeValue]]) and also business days and a cut-off time.\n',
			rangeIncludes: ['QuantitativeValue', 'ServicePeriod'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShippingDeliveryTime;
export const ShippingDeliveryTime = schemaOrgShippingDeliveryTime;

export default schemaOrgShippingDeliveryTime;

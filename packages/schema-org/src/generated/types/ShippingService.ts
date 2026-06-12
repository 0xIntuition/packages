import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShippingService = {
	id: 'schema:ShippingService',
	name: 'ShippingService',
	label: 'ShippingService',
	comment:
		'ShippingService represents the criteria used to determine if and how an offer could be shipped to a customer.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:fulfillmentType',
			name: 'fulfillmentType',
			label: 'fulfillmentType',
			comment: 'Type of fulfillment applicable to the [[ShippingService]].',
			rangeIncludes: ['FulfillmentTypeEnumeration'],
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
			id: 'schema:shippingConditions',
			name: 'shippingConditions',
			label: 'shippingConditions',
			comment: 'The conditions (constraints, price) applicable to the [[ShippingService]].',
			rangeIncludes: ['ShippingConditions'],
		},
		{
			id: 'schema:validForMemberTier',
			name: 'validForMemberTier',
			label: 'validForMemberTier',
			comment:
				'The membership program tier(s) an Offer (or a PriceSpecification, OfferShippingDetails, or MerchantReturnPolicy under an Offer) is valid for.',
			rangeIncludes: ['MemberProgramTier'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShippingService;
export const ShippingService = schemaOrgShippingService;

export default schemaOrgShippingService;

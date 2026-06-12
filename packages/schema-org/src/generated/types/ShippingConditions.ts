import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShippingConditions = {
	id: 'schema:ShippingConditions',
	name: 'ShippingConditions',
	label: 'ShippingConditions',
	comment:
		'ShippingConditions represent a set of constraints and information about the conditions of shipping a product. Such conditions may apply to only a subset of the products being shipped, depending on aspects of the product like weight, size, price, destination, and others. All the specified conditions must be met for this ShippingConditions to apply.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:depth',
			name: 'depth',
			label: 'depth',
			comment: 'The depth of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
		},
		{
			id: 'schema:doesNotShip',
			name: 'doesNotShip',
			label: 'doesNotShip',
			comment: 'Indicates when shipping to a particular [[shippingDestination]] is not available.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:height',
			name: 'height',
			label: 'height',
			comment: 'The height of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
		},
		{
			id: 'schema:numItems',
			name: 'numItems',
			label: 'numItems',
			comment: 'Limits the number of items being shipped for which these conditions apply.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:orderValue',
			name: 'orderValue',
			label: 'orderValue',
			comment: 'Minimum and maximum order value for which these shipping conditions are valid.',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:seasonalOverride',
			name: 'seasonalOverride',
			label: 'seasonalOverride',
			comment: 'Limited period during which these shipping conditions apply.',
			rangeIncludes: ['OpeningHoursSpecification'],
		},
		{
			id: 'schema:shippingDestination',
			name: 'shippingDestination',
			label: 'shippingDestination',
			comment:
				'indicates (possibly multiple) shipping destinations. These can be defined in several ways, e.g. postalCode ranges.',
			rangeIncludes: ['DefinedRegion'],
		},
		{
			id: 'schema:shippingOrigin',
			name: 'shippingOrigin',
			label: 'shippingOrigin',
			comment: 'Indicates the origin of a shipment, i.e. where it should be coming from.',
			rangeIncludes: ['DefinedRegion'],
		},
		{
			id: 'schema:shippingRate',
			name: 'shippingRate',
			label: 'shippingRate',
			comment:
				'The shipping rate is the cost of shipping to the specified destination. Typically, the maxValue and currency values (of the [[MonetaryAmount]]) are most appropriate.',
			rangeIncludes: ['MonetaryAmount', 'ShippingRateSettings'],
		},
		{
			id: 'schema:transitTime',
			name: 'transitTime',
			label: 'transitTime',
			comment:
				'The typical delay the order has been sent for delivery and the goods reach the final customer.\n\n  In the context of [[ShippingDeliveryTime]], use the [[QuantitativeValue]]. Typical properties: minValue, maxValue, unitCode (d for DAY).\n\n  In the context of [[ShippingConditions]], use the [[ServicePeriod]]. It has a duration (as a [[QuantitativeValue]]) and also business days and a cut-off time.\n',
			rangeIncludes: ['QuantitativeValue', 'ServicePeriod'],
		},
		{
			id: 'schema:weight',
			name: 'weight',
			label: 'weight',
			comment: 'The weight of the product or person.',
			rangeIncludes: ['Mass', 'QuantitativeValue'],
		},
		{
			id: 'schema:width',
			name: 'width',
			label: 'width',
			comment: 'The width of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShippingConditions;
export const ShippingConditions = schemaOrgShippingConditions;

export default schemaOrgShippingConditions;

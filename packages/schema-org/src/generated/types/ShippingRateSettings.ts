import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShippingRateSettings = {
	id: 'schema:ShippingRateSettings',
	name: 'ShippingRateSettings',
	label: 'ShippingRateSettings',
	comment:
		'A ShippingRateSettings represents re-usable pieces of shipping information. It is designed for publication on an URL that may be referenced via the [[shippingSettingsLink]] property of an [[OfferShippingDetails]]. Several occurrences can be published, distinguished and matched (i.e. identified/referenced) by their different values for [[shippingLabel]].',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:doesNotShip',
			name: 'doesNotShip',
			label: 'doesNotShip',
			comment: 'Indicates when shipping to a particular [[shippingDestination]] is not available.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:freeShippingThreshold',
			name: 'freeShippingThreshold',
			label: 'freeShippingThreshold',
			comment:
				'A monetary value above (or at) which the shipping rate becomes free. Intended to be used via an [[OfferShippingDetails]] with [[shippingSettingsLink]] matching this [[ShippingRateSettings]].',
			rangeIncludes: ['DeliveryChargeSpecification', 'MonetaryAmount'],
		},
		{
			id: 'schema:isUnlabelledFallback',
			name: 'isUnlabelledFallback',
			label: 'isUnlabelledFallback',
			comment:
				"This can be marked 'true' to indicate that some published [[DeliveryTimeSettings]] or [[ShippingRateSettings]] are intended to apply to all [[OfferShippingDetails]] published by the same merchant, when referenced by a [[shippingSettingsLink]] in those settings. It is not meaningful to use a 'true' value for this property alongside a transitTimeLabel (for [[DeliveryTimeSettings]]) or shippingLabel (for [[ShippingRateSettings]]), since this property is for use with unlabelled settings.",
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:orderPercentage',
			name: 'orderPercentage',
			label: 'orderPercentage',
			comment:
				'Value representing the fraction of the value of the order that is charged as shipping cost. Example: 0.10 would mean shipping rate is 10% of the total order value.',
			rangeIncludes: ['Number'],
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
			id: 'schema:shippingRate',
			name: 'shippingRate',
			label: 'shippingRate',
			comment:
				'The shipping rate is the cost of shipping to the specified destination. Typically, the maxValue and currency values (of the [[MonetaryAmount]]) are most appropriate.',
			rangeIncludes: ['MonetaryAmount', 'ShippingRateSettings'],
		},
		{
			id: 'schema:weightPercentage',
			name: 'weightPercentage',
			label: 'weightPercentage',
			comment:
				'Value representing the fraction of the weight that is used to compute the shipping price. Example: 0.10 and a shipping weight of 15kg would add $1.5 to the order price, where the $ is the currency of the order.',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShippingRateSettings;
export const ShippingRateSettings = schemaOrgShippingRateSettings;

export default schemaOrgShippingRateSettings;

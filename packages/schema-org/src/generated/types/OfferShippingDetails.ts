import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOfferShippingDetails = {
	id: 'schema:OfferShippingDetails',
	name: 'OfferShippingDetails',
	label: 'OfferShippingDetails',
	comment:
		'OfferShippingDetails represents information about shipping destinations.\n\nMultiple of these entities can be used to represent different shipping rates for different destinations:\n\nOne entity for Alaska/Hawaii. A different one for continental US. A different one for all France.\n\nMultiple of these entities can be used to represent different shipping costs and delivery times.\n\nTwo entities that are identical but differ in rate and time:\n\nE.g. Cheaper and slower: $5 in 5-7 days\nor Fast and expensive: $15 in 1-2 days.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:deliveryTime',
			name: 'deliveryTime',
			label: 'deliveryTime',
			comment:
				'The total delay between the receipt of the order and the goods reaching the final customer.',
			rangeIncludes: ['ShippingDeliveryTime'],
		},
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
			id: 'schema:hasShippingService',
			name: 'hasShippingService',
			label: 'hasShippingService',
			comment: 'Specification of a shipping service offered by the organization.',
			rangeIncludes: ['ShippingService'],
		},
		{
			id: 'schema:height',
			name: 'height',
			label: 'height',
			comment: 'The height of the item.',
			rangeIncludes: ['Distance', 'QuantitativeValue'],
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
			id: 'schema:validForMemberTier',
			name: 'validForMemberTier',
			label: 'validForMemberTier',
			comment:
				'The membership program tier(s) an Offer (or a PriceSpecification, OfferShippingDetails, or MerchantReturnPolicy under an Offer) is valid for.',
			rangeIncludes: ['MemberProgramTier'],
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

export const spec = schemaOrgOfferShippingDetails;
export const OfferShippingDetails = schemaOrgOfferShippingDetails;

export default schemaOrgOfferShippingDetails;

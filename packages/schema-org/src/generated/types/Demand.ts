import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDemand = {
	id: 'schema:Demand',
	name: 'Demand',
	label: 'Demand',
	comment:
		'A demand entity represents the public, not necessarily binding, not necessarily exclusive, announcement by an organization or person to seek a certain type of goods or services. For describing demand using this type, the very same properties used for Offer apply.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:acceptedPaymentMethod',
			name: 'acceptedPaymentMethod',
			label: 'acceptedPaymentMethod',
			comment:
				'The payment method(s) that are accepted in general by an organization, or for some specific demand or offer.',
			rangeIncludes: ['LoanOrCredit', 'PaymentMethod', 'Text'],
		},
		{
			id: 'schema:advanceBookingRequirement',
			name: 'advanceBookingRequirement',
			label: 'advanceBookingRequirement',
			comment:
				'The amount of time that is required between accepting the offer and the actual usage of the resource or service.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:areaServed',
			name: 'areaServed',
			label: 'areaServed',
			comment: 'The geographic area where a service or offered item is provided.',
			rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:asin',
			name: 'asin',
			label: 'asin',
			comment:
				"An Amazon Standard Identification Number (ASIN) is a 10-character alphanumeric unique identifier assigned by Amazon.com and its partners for product identification within the Amazon organization (summary from [Wikipedia](https://en.wikipedia.org/wiki/Amazon_Standard_Identification_Number)'s article).\n\nNote also that this is a definition for how to include ASINs in Schema.org data, and not a definition of ASINs in general - see documentation from Amazon for authoritative details.\nASINs are most commonly encoded as text strings, but the [asin] property supports URL/URI as potential values too.",
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:availability',
			name: 'availability',
			label: 'availability',
			comment:
				'The availability of this item&#x2014;for example In stock, Out of stock, Pre-order, etc.',
			rangeIncludes: ['ItemAvailability'],
		},
		{
			id: 'schema:availabilityEnds',
			name: 'availabilityEnds',
			label: 'availabilityEnds',
			comment: 'The end of the availability of the product or service included in the offer.',
			rangeIncludes: ['Date', 'DateTime', 'Time'],
		},
		{
			id: 'schema:availabilityStarts',
			name: 'availabilityStarts',
			label: 'availabilityStarts',
			comment: 'The beginning of the availability of the product or service included in the offer.',
			rangeIncludes: ['Date', 'DateTime', 'Time'],
		},
		{
			id: 'schema:availableAtOrFrom',
			name: 'availableAtOrFrom',
			label: 'availableAtOrFrom',
			comment: 'The place(s) from which the offer can be obtained (e.g. store locations).',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:availableDeliveryMethod',
			name: 'availableDeliveryMethod',
			label: 'availableDeliveryMethod',
			comment: 'The delivery method(s) available for this offer.',
			rangeIncludes: ['DeliveryMethod'],
		},
		{
			id: 'schema:businessFunction',
			name: 'businessFunction',
			label: 'businessFunction',
			comment:
				'The business function (e.g. sell, lease, repair, dispose) of the offer or component of a bundle (TypeAndQuantityNode). The default is http://purl.org/goodrelations/v1#Sell.',
			rangeIncludes: ['BusinessFunction'],
		},
		{
			id: 'schema:deliveryLeadTime',
			name: 'deliveryLeadTime',
			label: 'deliveryLeadTime',
			comment:
				'The typical delay between the receipt of the order and the goods either leaving the warehouse or being prepared for pickup, in case the delivery method is on site pickup.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:eligibleCustomerType',
			name: 'eligibleCustomerType',
			label: 'eligibleCustomerType',
			comment: 'The type(s) of customers for which the given offer is valid.',
			rangeIncludes: ['BusinessEntityType'],
		},
		{
			id: 'schema:eligibleDuration',
			name: 'eligibleDuration',
			label: 'eligibleDuration',
			comment: 'The duration for which the given offer is valid.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:eligibleQuantity',
			name: 'eligibleQuantity',
			label: 'eligibleQuantity',
			comment:
				'The interval and unit of measurement of ordering quantities for which the offer or price specification is valid. This allows e.g. specifying that a certain freight charge is valid only for a certain quantity.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:eligibleRegion',
			name: 'eligibleRegion',
			label: 'eligibleRegion',
			comment:
				'The ISO 3166-1 (ISO 3166-1 alpha-2) or ISO 3166-2 code, the place, or the GeoShape for the geo-political region(s) for which the offer or delivery charge specification is valid.\\n\\nSee also [[ineligibleRegion]].\n    ',
			rangeIncludes: ['GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:eligibleTransactionVolume',
			name: 'eligibleTransactionVolume',
			label: 'eligibleTransactionVolume',
			comment:
				'The transaction volume, in a monetary unit, for which the offer or price specification is valid, e.g. for indicating a minimal purchasing volume, to express free shipping above a certain order volume, or to limit the acceptance of credit cards to purchases to a certain minimal amount.',
			rangeIncludes: ['PriceSpecification'],
		},
		{
			id: 'schema:gtin',
			name: 'gtin',
			label: 'gtin',
			comment:
				'A Global Trade Item Number ([GTIN](https://www.gs1.org/standards/id-keys/gtin)). GTINs identify trade items, including products and services, using numeric identification codes.\n\nA correct [[gtin]] value should be a valid GTIN, which means that it should be an all-numeric string of either 8, 12, 13 or 14 digits, or a "GS1 Digital Link" URL based on such a string. The numeric component should also have a [valid GS1 check digit](https://www.gs1.org/services/check-digit-calculator) and meet the other rules for valid GTINs. See also [GS1\'s GTIN Summary](http://www.gs1.org/barcodes/technical/idkeys/gtin) and [Wikipedia](https://en.wikipedia.org/wiki/Global_Trade_Item_Number) for more details. Left-padding of the gtin values is not required or encouraged. The [[gtin]] property generalizes the earlier [[gtin8]], [[gtin12]], [[gtin13]], and [[gtin14]] properties.\n\nThe GS1 [digital link specifications](https://www.gs1.org/standards/Digital-Link/) expresses GTINs as URLs (URIs, IRIs, etc.).\nDigital Links should be populated into the [[hasGS1DigitalLink]] attribute.\n\nNote also that this is a definition for how to include GTINs in Schema.org data, and not a definition of GTINs in general - see the GS1 documentation for authoritative details.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:gtin12',
			name: 'gtin12',
			label: 'gtin12',
			comment:
				'The GTIN-12 code of the product, or the product to which the offer refers. The GTIN-12 is the 12-digit GS1 Identification Key composed of a U.P.C. Company Prefix, Item Reference, and Check Digit used to identify trade items. See [GS1 GTIN Summary](http://www.gs1.org/barcodes/technical/idkeys/gtin) for more details.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:gtin13',
			name: 'gtin13',
			label: 'gtin13',
			comment:
				'The GTIN-13 code of the product, or the product to which the offer refers. This is equivalent to 13-digit ISBN codes and EAN UCC-13. Former 12-digit UPC codes can be converted into a GTIN-13 code by simply adding a preceding zero. See [GS1 GTIN Summary](http://www.gs1.org/barcodes/technical/idkeys/gtin) for more details.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:gtin14',
			name: 'gtin14',
			label: 'gtin14',
			comment:
				'The GTIN-14 code of the product, or the product to which the offer refers. See [GS1 GTIN Summary](http://www.gs1.org/barcodes/technical/idkeys/gtin) for more details.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:gtin8',
			name: 'gtin8',
			label: 'gtin8',
			comment:
				'The GTIN-8 code of the product, or the product to which the offer refers. This code is also known as EAN/UCC-8 or 8-digit EAN. See [GS1 GTIN Summary](http://www.gs1.org/barcodes/technical/idkeys/gtin) for more details.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:includesObject',
			name: 'includesObject',
			label: 'includesObject',
			comment:
				'This links to a node or nodes indicating the exact quantity of the products included in  an [[Offer]] or [[ProductCollection]].',
			rangeIncludes: ['TypeAndQuantityNode'],
		},
		{
			id: 'schema:ineligibleRegion',
			name: 'ineligibleRegion',
			label: 'ineligibleRegion',
			comment:
				'The ISO 3166-1 (ISO 3166-1 alpha-2) or ISO 3166-2 code, the place, or the GeoShape for the geo-political region(s) for which the offer or delivery charge specification is not valid, e.g. a region where the transaction is not allowed.\\n\\nSee also [[eligibleRegion]].\n      ',
			rangeIncludes: ['GeoShape', 'Place', 'Text'],
		},
		{
			id: 'schema:inventoryLevel',
			name: 'inventoryLevel',
			label: 'inventoryLevel',
			comment: 'The current approximate inventory level for the item or items.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:itemCondition',
			name: 'itemCondition',
			label: 'itemCondition',
			comment:
				'A predefined value from OfferItemCondition specifying the condition of the product or service, or the products or services included in the offer. Also used for product return policies to specify the condition of products accepted for returns.',
			rangeIncludes: ['OfferItemCondition'],
		},
		{
			id: 'schema:itemOffered',
			name: 'itemOffered',
			label: 'itemOffered',
			comment:
				'An item being offered (or demanded). The transactional nature of the offer or demand is documented using [[businessFunction]], e.g. sell, lease etc. While several common expected types are listed explicitly in this definition, others can be used. Using a second type, such as Product or a subtype of Product, can clarify the nature of the offer.',
			rangeIncludes: [
				'AggregateOffer',
				'CreativeWork',
				'Event',
				'MenuItem',
				'Product',
				'Service',
				'Trip',
			],
		},
		{
			id: 'schema:mpn',
			name: 'mpn',
			label: 'mpn',
			comment:
				'The Manufacturer Part Number (MPN) of the product, or the product to which the offer refers.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:priceSpecification',
			name: 'priceSpecification',
			label: 'priceSpecification',
			comment:
				'One or more detailed price specifications, indicating the unit price and delivery or payment charges.',
			rangeIncludes: ['PriceSpecification'],
		},
		{
			id: 'schema:seller',
			name: 'seller',
			label: 'seller',
			comment:
				'An entity which offers (sells / leases / lends / loans) the services / goods.  A seller may also be a provider.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:serialNumber',
			name: 'serialNumber',
			label: 'serialNumber',
			comment:
				'The serial number or any alphanumeric identifier of a particular product. When attached to an offer, it is a shortcut for the serial number of the product included in the offer.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:sku',
			name: 'sku',
			label: 'sku',
			comment:
				'The Stock Keeping Unit (SKU), i.e. a merchant-specific identifier for a product or service, or the product to which the offer refers.',
			rangeIncludes: ['Text'],
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
		{
			id: 'schema:warranty',
			name: 'warranty',
			label: 'warranty',
			comment: 'The warranty promise(s) included in the offer.',
			rangeIncludes: ['WarrantyPromise'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDemand;
export const Demand = schemaOrgDemand;

export default schemaOrgDemand;

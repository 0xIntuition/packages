import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgParcelDelivery = {
	id: 'schema:ParcelDelivery',
	name: 'ParcelDelivery',
	label: 'ParcelDelivery',
	comment: 'The delivery of a parcel either via the postal service or a commercial service.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:carrier',
			name: 'carrier',
			label: 'carrier',
			comment:
				"'carrier' is an out-dated term indicating the 'provider' for parcel delivery and flights.",
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:deliveryAddress',
			name: 'deliveryAddress',
			label: 'deliveryAddress',
			comment: 'Destination address.',
			rangeIncludes: ['PostalAddress'],
		},
		{
			id: 'schema:deliveryStatus',
			name: 'deliveryStatus',
			label: 'deliveryStatus',
			comment:
				'New entry added as the package passes through each leg of its journey (from shipment to final delivery).',
			rangeIncludes: ['DeliveryEvent'],
		},
		{
			id: 'schema:expectedArrivalFrom',
			name: 'expectedArrivalFrom',
			label: 'expectedArrivalFrom',
			comment: 'The earliest date the package may arrive.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:expectedArrivalUntil',
			name: 'expectedArrivalUntil',
			label: 'expectedArrivalUntil',
			comment: 'The latest date the package may arrive.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:hasDeliveryMethod',
			name: 'hasDeliveryMethod',
			label: 'hasDeliveryMethod',
			comment: 'Method used for delivery or shipping.',
			rangeIncludes: ['DeliveryMethod'],
		},
		{
			id: 'schema:itemShipped',
			name: 'itemShipped',
			label: 'itemShipped',
			comment: 'Item(s) being shipped.',
			rangeIncludes: ['Product'],
		},
		{
			id: 'schema:originAddress',
			name: 'originAddress',
			label: 'originAddress',
			comment: "Shipper's address.",
			rangeIncludes: ['PostalAddress'],
		},
		{
			id: 'schema:partOfOrder',
			name: 'partOfOrder',
			label: 'partOfOrder',
			comment: 'The overall order the items in this delivery were included in.',
			rangeIncludes: ['Order'],
		},
		{
			id: 'schema:provider',
			name: 'provider',
			label: 'provider',
			comment:
				'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:trackingNumber',
			name: 'trackingNumber',
			label: 'trackingNumber',
			comment: 'Shipper tracking number.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:trackingUrl',
			name: 'trackingUrl',
			label: 'trackingUrl',
			comment: 'Tracking url for the parcel delivery.',
			rangeIncludes: ['URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgParcelDelivery;
export const ParcelDelivery = schemaOrgParcelDelivery;

export default schemaOrgParcelDelivery;

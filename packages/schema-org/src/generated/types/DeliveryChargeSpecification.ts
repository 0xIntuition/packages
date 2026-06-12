import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDeliveryChargeSpecification = {
	id: 'schema:DeliveryChargeSpecification',
	name: 'DeliveryChargeSpecification',
	label: 'DeliveryChargeSpecification',
	comment: 'The price for the delivery of an offer using a particular delivery method.',
	subClassOf: ['PriceSpecification', 'StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:appliesToDeliveryMethod',
			name: 'appliesToDeliveryMethod',
			label: 'appliesToDeliveryMethod',
			comment:
				'The delivery method(s) to which the delivery charge or payment charge specification applies.',
			rangeIncludes: ['DeliveryMethod'],
		},
		{
			id: 'schema:areaServed',
			name: 'areaServed',
			label: 'areaServed',
			comment: 'The geographic area where a service or offered item is provided.',
			rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place', 'Text'],
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
			id: 'schema:ineligibleRegion',
			name: 'ineligibleRegion',
			label: 'ineligibleRegion',
			comment:
				'The ISO 3166-1 (ISO 3166-1 alpha-2) or ISO 3166-2 code, the place, or the GeoShape for the geo-political region(s) for which the offer or delivery charge specification is not valid, e.g. a region where the transaction is not allowed.\\n\\nSee also [[eligibleRegion]].\n      ',
			rangeIncludes: ['GeoShape', 'Place', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDeliveryChargeSpecification;
export const DeliveryChargeSpecification = schemaOrgDeliveryChargeSpecification;

export default schemaOrgDeliveryChargeSpecification;

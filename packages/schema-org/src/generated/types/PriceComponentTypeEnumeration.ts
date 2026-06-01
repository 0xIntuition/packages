import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPriceComponentTypeEnumeration = {
	id: 'schema:PriceComponentTypeEnumeration',
	name: 'PriceComponentTypeEnumeration',
	label: 'PriceComponentTypeEnumeration',
	comment:
		'Enumerates different price components that together make up the total price for an offered product.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPriceComponentTypeEnumeration;
export const PriceComponentTypeEnumeration = schemaOrgPriceComponentTypeEnumeration;

export default schemaOrgPriceComponentTypeEnumeration;

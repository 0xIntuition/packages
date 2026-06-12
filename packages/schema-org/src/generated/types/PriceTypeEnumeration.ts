import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPriceTypeEnumeration = {
	id: 'schema:PriceTypeEnumeration',
	name: 'PriceTypeEnumeration',
	label: 'PriceTypeEnumeration',
	comment:
		'Enumerates different price types, for example list price, invoice price, and sale price.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPriceTypeEnumeration;
export const PriceTypeEnumeration = schemaOrgPriceTypeEnumeration;

export default schemaOrgPriceTypeEnumeration;

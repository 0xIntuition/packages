import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPurchaseType = {
	id: 'schema:PurchaseType',
	name: 'PurchaseType',
	label: 'PurchaseType',
	comment: 'Enumerates a purchase type for an item.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPurchaseType;
export const PurchaseType = schemaOrgPurchaseType;

export default schemaOrgPurchaseType;

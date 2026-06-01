import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOrderStatus = {
	id: 'schema:OrderStatus',
	name: 'OrderStatus',
	label: 'OrderStatus',
	comment: 'Enumerated status values for Order.',
	subClassOf: ['StatusEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOrderStatus;
export const OrderStatus = schemaOrgOrderStatus;

export default schemaOrgOrderStatus;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSaleEvent = {
	id: 'schema:SaleEvent',
	name: 'SaleEvent',
	label: 'SaleEvent',
	comment: 'Event type: Sales event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSaleEvent;
export const SaleEvent = schemaOrgSaleEvent;

export default schemaOrgSaleEvent;

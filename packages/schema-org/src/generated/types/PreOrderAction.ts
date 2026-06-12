import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPreOrderAction = {
	id: 'schema:PreOrderAction',
	name: 'PreOrderAction',
	label: 'PreOrderAction',
	comment: 'An agent orders a (not yet released) object/product/service to be delivered/sent.',
	subClassOf: ['TradeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPreOrderAction;
export const PreOrderAction = schemaOrgPreOrderAction;

export default schemaOrgPreOrderAction;

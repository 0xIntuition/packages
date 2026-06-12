import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOrderAction = {
	id: 'schema:OrderAction',
	name: 'OrderAction',
	label: 'OrderAction',
	comment: 'An agent orders an object/product/service to be delivered/sent.',
	subClassOf: ['TradeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:deliveryMethod',
			name: 'deliveryMethod',
			label: 'deliveryMethod',
			comment: 'A sub property of instrument. The method of delivery.',
			rangeIncludes: ['DeliveryMethod'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOrderAction;
export const OrderAction = schemaOrgOrderAction;

export default schemaOrgOrderAction;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBuyAction = {
	id: 'schema:BuyAction',
	name: 'BuyAction',
	label: 'BuyAction',
	comment:
		'The act of giving money to a seller in exchange for goods or services rendered. An agent buys an object, product, or service from a seller for a price. Reciprocal of SellAction.',
	subClassOf: ['TradeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:seller',
			name: 'seller',
			label: 'seller',
			comment:
				'An entity which offers (sells / leases / lends / loans) the services / goods.  A seller may also be a provider.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:vendor',
			name: 'vendor',
			label: 'vendor',
			comment: "'vendor' is an earlier term for 'seller'.",
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:warrantyPromise',
			name: 'warrantyPromise',
			label: 'warrantyPromise',
			comment: 'The warranty promise(s) included in the offer.',
			rangeIncludes: ['WarrantyPromise'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBuyAction;
export const BuyAction = schemaOrgBuyAction;

export default schemaOrgBuyAction;

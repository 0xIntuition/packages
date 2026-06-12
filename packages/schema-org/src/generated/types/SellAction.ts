import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSellAction = {
	id: 'schema:SellAction',
	name: 'SellAction',
	label: 'SellAction',
	comment:
		'The act of taking money from a buyer in exchange for goods or services rendered. An agent sells an object, product, or service to a buyer for a price. Reciprocal of BuyAction.',
	subClassOf: ['TradeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:buyer',
			name: 'buyer',
			label: 'buyer',
			comment:
				'A sub property of participant. The participant/person/organization that bought the object.',
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

export const spec = schemaOrgSellAction;
export const SellAction = schemaOrgSellAction;

export default schemaOrgSellAction;

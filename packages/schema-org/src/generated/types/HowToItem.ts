import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowToItem = {
	id: 'schema:HowToItem',
	name: 'HowToItem',
	label: 'HowToItem',
	comment:
		'An item used as either a tool or supply when performing the instructions for how to achieve a result.',
	subClassOf: ['ListItem', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:requiredQuantity',
			name: 'requiredQuantity',
			label: 'requiredQuantity',
			comment: 'The required quantity of the item(s).',
			rangeIncludes: ['Number', 'QuantitativeValue', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowToItem;
export const HowToItem = schemaOrgHowToItem;

export default schemaOrgHowToItem;

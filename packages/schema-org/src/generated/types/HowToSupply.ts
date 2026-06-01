import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHowToSupply = {
	id: 'schema:HowToSupply',
	name: 'HowToSupply',
	label: 'HowToSupply',
	comment: 'A supply consumed when performing the instructions for how to achieve a result.',
	subClassOf: ['HowToItem', 'ListItem', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:estimatedCost',
			name: 'estimatedCost',
			label: 'estimatedCost',
			comment:
				'The estimated cost of the supply or supplies consumed when performing instructions.',
			rangeIncludes: ['MonetaryAmount', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHowToSupply;
export const HowToSupply = schemaOrgHowToSupply;

export default schemaOrgHowToSupply;

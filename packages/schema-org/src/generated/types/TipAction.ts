import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTipAction = {
	id: 'schema:TipAction',
	name: 'TipAction',
	label: 'TipAction',
	comment:
		'The act of giving money voluntarily to a beneficiary in recognition of services rendered.',
	subClassOf: ['TradeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:recipient',
			name: 'recipient',
			label: 'recipient',
			comment:
				'A sub property of participant. The participant who is at the receiving end of the action.',
			rangeIncludes: ['Audience', 'ContactPoint', 'Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTipAction;
export const TipAction = schemaOrgTipAction;

export default schemaOrgTipAction;

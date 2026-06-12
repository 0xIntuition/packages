import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPayAction = {
	id: 'schema:PayAction',
	name: 'PayAction',
	label: 'PayAction',
	comment: 'An agent pays a price to a participant.',
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

export const spec = schemaOrgPayAction;
export const PayAction = schemaOrgPayAction;

export default schemaOrgPayAction;

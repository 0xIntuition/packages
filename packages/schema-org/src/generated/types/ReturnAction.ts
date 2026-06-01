import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReturnAction = {
	id: 'schema:ReturnAction',
	name: 'ReturnAction',
	label: 'ReturnAction',
	comment:
		'The act of returning to the origin that which was previously received (concrete objects) or taken (ownership).',
	subClassOf: ['TransferAction', 'Action', 'Thing'],
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

export const spec = schemaOrgReturnAction;
export const ReturnAction = schemaOrgReturnAction;

export default schemaOrgReturnAction;

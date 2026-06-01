import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWinAction = {
	id: 'schema:WinAction',
	name: 'WinAction',
	label: 'WinAction',
	comment: 'The act of achieving victory in a competitive activity.',
	subClassOf: ['AchieveAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:loser',
			name: 'loser',
			label: 'loser',
			comment: 'A sub property of participant. The loser of the action.',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWinAction;
export const WinAction = schemaOrgWinAction;

export default schemaOrgWinAction;

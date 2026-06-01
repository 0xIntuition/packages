import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLoseAction = {
	id: 'schema:LoseAction',
	name: 'LoseAction',
	label: 'LoseAction',
	comment: 'The act of being defeated in a competitive activity.',
	subClassOf: ['AchieveAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:winner',
			name: 'winner',
			label: 'winner',
			comment: 'A sub property of participant. The winner of the action.',
			rangeIncludes: ['Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLoseAction;
export const LoseAction = schemaOrgLoseAction;

export default schemaOrgLoseAction;

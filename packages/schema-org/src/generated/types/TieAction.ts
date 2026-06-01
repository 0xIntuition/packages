import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTieAction = {
	id: 'schema:TieAction',
	name: 'TieAction',
	label: 'TieAction',
	comment: 'The act of reaching a draw in a competitive activity.',
	subClassOf: ['AchieveAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTieAction;
export const TieAction = schemaOrgTieAction;

export default schemaOrgTieAction;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOrganizeAction = {
	id: 'schema:OrganizeAction',
	name: 'OrganizeAction',
	label: 'OrganizeAction',
	comment: 'The act of manipulating/administering/supervising/controlling one or more objects.',
	subClassOf: ['Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOrganizeAction;
export const OrganizeAction = schemaOrgOrganizeAction;

export default schemaOrgOrganizeAction;

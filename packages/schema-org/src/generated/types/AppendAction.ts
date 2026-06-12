import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAppendAction = {
	id: 'schema:AppendAction',
	name: 'AppendAction',
	label: 'AppendAction',
	comment: 'The act of inserting at the end if an ordered collection.',
	subClassOf: ['InsertAction', 'AddAction', 'UpdateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAppendAction;
export const AppendAction = schemaOrgAppendAction;

export default schemaOrgAppendAction;

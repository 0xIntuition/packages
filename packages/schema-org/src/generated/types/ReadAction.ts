import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReadAction = {
	id: 'schema:ReadAction',
	name: 'ReadAction',
	label: 'ReadAction',
	comment: 'The act of consuming written content.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReadAction;
export const ReadAction = schemaOrgReadAction;

export default schemaOrgReadAction;

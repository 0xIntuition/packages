import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgViewAction = {
	id: 'schema:ViewAction',
	name: 'ViewAction',
	label: 'ViewAction',
	comment: 'The act of consuming static visual content.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgViewAction;
export const ViewAction = schemaOrgViewAction;

export default schemaOrgViewAction;

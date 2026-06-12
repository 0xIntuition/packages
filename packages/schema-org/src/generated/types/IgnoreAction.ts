import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIgnoreAction = {
	id: 'schema:IgnoreAction',
	name: 'IgnoreAction',
	label: 'IgnoreAction',
	comment: 'The act of intentionally disregarding the object. An agent ignores an object.',
	subClassOf: ['AssessAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIgnoreAction;
export const IgnoreAction = schemaOrgIgnoreAction;

export default schemaOrgIgnoreAction;

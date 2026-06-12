import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWantAction = {
	id: 'schema:WantAction',
	name: 'WantAction',
	label: 'WantAction',
	comment: 'The act of expressing a desire about the object. An agent wants an object.',
	subClassOf: ['ReactAction', 'AssessAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWantAction;
export const WantAction = schemaOrgWantAction;

export default schemaOrgWantAction;

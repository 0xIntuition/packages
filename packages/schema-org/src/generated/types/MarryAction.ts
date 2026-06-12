import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMarryAction = {
	id: 'schema:MarryAction',
	name: 'MarryAction',
	label: 'MarryAction',
	comment: 'The act of marrying a person.',
	subClassOf: ['InteractAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMarryAction;
export const MarryAction = schemaOrgMarryAction;

export default schemaOrgMarryAction;

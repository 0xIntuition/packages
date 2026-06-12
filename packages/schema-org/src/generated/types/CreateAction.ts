import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCreateAction = {
	id: 'schema:CreateAction',
	name: 'CreateAction',
	label: 'CreateAction',
	comment:
		'The act of deliberately creating/producing/generating/building a result out of the agent.',
	subClassOf: ['Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCreateAction;
export const CreateAction = schemaOrgCreateAction;

export default schemaOrgCreateAction;

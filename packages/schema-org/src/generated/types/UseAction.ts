import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUseAction = {
	id: 'schema:UseAction',
	name: 'UseAction',
	label: 'UseAction',
	comment: 'The act of applying an object to its intended purpose.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUseAction;
export const UseAction = schemaOrgUseAction;

export default schemaOrgUseAction;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPrependAction = {
	id: 'schema:PrependAction',
	name: 'PrependAction',
	label: 'PrependAction',
	comment: 'The act of inserting at the beginning if an ordered collection.',
	subClassOf: ['InsertAction', 'AddAction', 'UpdateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPrependAction;
export const PrependAction = schemaOrgPrependAction;

export default schemaOrgPrependAction;

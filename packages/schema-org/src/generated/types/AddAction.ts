import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAddAction = {
	id: 'schema:AddAction',
	name: 'AddAction',
	label: 'AddAction',
	comment: 'The act of editing by adding an object to a collection.',
	subClassOf: ['UpdateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAddAction;
export const AddAction = schemaOrgAddAction;

export default schemaOrgAddAction;

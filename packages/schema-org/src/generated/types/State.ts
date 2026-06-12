import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgState = {
	id: 'schema:State',
	name: 'State',
	label: 'State',
	comment: 'A state or province of a country.',
	subClassOf: ['AdministrativeArea', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgState;
export const State = schemaOrgState;

export default schemaOrgState;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDepartAction = {
	id: 'schema:DepartAction',
	name: 'DepartAction',
	label: 'DepartAction',
	comment:
		'The act of  departing from a place. An agent departs from a fromLocation for a destination, optionally with participants.',
	subClassOf: ['MoveAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDepartAction;
export const DepartAction = schemaOrgDepartAction;

export default schemaOrgDepartAction;

import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgArriveAction = {
	id: 'schema:ArriveAction',
	name: 'ArriveAction',
	label: 'ArriveAction',
	comment:
		'The act of arriving at a place. An agent arrives at a destination from a fromLocation, optionally with participants.',
	subClassOf: ['MoveAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgArriveAction;
export const ArriveAction = schemaOrgArriveAction;

export default schemaOrgArriveAction;

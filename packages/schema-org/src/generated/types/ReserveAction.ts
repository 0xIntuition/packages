import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReserveAction = {
	id: 'schema:ReserveAction',
	name: 'ReserveAction',
	label: 'ReserveAction',
	comment:
		'Reserving a concrete object.\\n\\nRelated actions:\\n\\n* [[ScheduleAction]]: Unlike ScheduleAction, ReserveAction reserves concrete objects (e.g. a table, a hotel) towards a time slot / spatial allocation.',
	subClassOf: ['PlanAction', 'OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReserveAction;
export const ReserveAction = schemaOrgReserveAction;

export default schemaOrgReserveAction;

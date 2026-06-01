import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgScheduleAction = {
	id: 'schema:ScheduleAction',
	name: 'ScheduleAction',
	label: 'ScheduleAction',
	comment:
		'Scheduling future actions, events, or tasks.\\n\\nRelated actions:\\n\\n* [[ReserveAction]]: Unlike ReserveAction, ScheduleAction allocates future actions (e.g. an event, a task, etc) towards a time slot / spatial allocation.',
	subClassOf: ['PlanAction', 'OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgScheduleAction;
export const ScheduleAction = schemaOrgScheduleAction;

export default schemaOrgScheduleAction;

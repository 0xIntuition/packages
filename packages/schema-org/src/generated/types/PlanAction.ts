import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlanAction = {
	id: 'schema:PlanAction',
	name: 'PlanAction',
	label: 'PlanAction',
	comment:
		'The act of planning the execution of an event/task/action/reservation/plan to a future date.',
	subClassOf: ['OrganizeAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:scheduledTime',
			name: 'scheduledTime',
			label: 'scheduledTime',
			comment: 'The time the object is scheduled to.',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlanAction;
export const PlanAction = schemaOrgPlanAction;

export default schemaOrgPlanAction;

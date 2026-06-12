import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCheckOutAction = {
	id: 'schema:CheckOutAction',
	name: 'CheckOutAction',
	label: 'CheckOutAction',
	comment:
		'The act of an agent communicating (service provider, social media, etc) their departure of a previously reserved service (e.g. flight check-in) or place (e.g. hotel).\\n\\nRelated actions:\\n\\n* [[CheckInAction]]: The antonym of CheckOutAction.\\n* [[DepartAction]]: Unlike DepartAction, CheckOutAction implies that the agent is informing/confirming the end of a previously reserved service.\\n* [[CancelAction]]: Unlike CancelAction, CheckOutAction implies that the agent is informing/confirming the end of a previously reserved service.',
	subClassOf: ['CommunicateAction', 'InteractAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCheckOutAction;
export const CheckOutAction = schemaOrgCheckOutAction;

export default schemaOrgCheckOutAction;

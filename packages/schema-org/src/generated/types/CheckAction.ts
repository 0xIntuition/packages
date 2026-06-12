import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCheckAction = {
	id: 'schema:CheckAction',
	name: 'CheckAction',
	label: 'CheckAction',
	comment:
		"An agent inspects, determines, investigates, inquires, or examines an object's accuracy, quality, condition, or state.",
	subClassOf: ['FindAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCheckAction;
export const CheckAction = schemaOrgCheckAction;

export default schemaOrgCheckAction;

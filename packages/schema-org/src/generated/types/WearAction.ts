import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWearAction = {
	id: 'schema:WearAction',
	name: 'WearAction',
	label: 'WearAction',
	comment: 'The act of dressing oneself in clothing.',
	subClassOf: ['UseAction', 'ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWearAction;
export const WearAction = schemaOrgWearAction;

export default schemaOrgWearAction;

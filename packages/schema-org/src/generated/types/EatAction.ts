import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEatAction = {
	id: 'schema:EatAction',
	name: 'EatAction',
	label: 'EatAction',
	comment: 'The act of swallowing solid objects.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEatAction;
export const EatAction = schemaOrgEatAction;

export default schemaOrgEatAction;

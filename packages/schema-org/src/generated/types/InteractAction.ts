import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInteractAction = {
	id: 'schema:InteractAction',
	name: 'InteractAction',
	label: 'InteractAction',
	comment: 'The act of interacting with another person or organization.',
	subClassOf: ['Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInteractAction;
export const InteractAction = schemaOrgInteractAction;

export default schemaOrgInteractAction;
